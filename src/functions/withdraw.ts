/* eslint-disable import/prefer-default-export */

import { ContractTransactionResponse, JsonRpcProvider, MaxUint256, Overrides } from 'ethers';
import { getAlgebraVaultDepositGuardContract, getERC20Contract, getAlgebraVaultContract } from '../contracts';
import parseBigInt from '../utils/parseBigInt';
import { AlgebraVault, SupportedChainId, algebraVaultDecimals } from '../types';
import { getGasLimit, calculateGasMargin } from '../types/calculateGasMargin';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { addressConfig } from '../config/addresses';
import amountWithSlippage from '../utils/amountWithSlippage';
import { getUserBalance } from './userBalances';
import getVaultDeployer from './vaultBasics';

export async function approveVaultToken(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  shares?: string | number | bigint,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId } = await validateVaultData(vaultAddress, jsonProvider);

  const signer = await jsonProvider.getSigner();

  const vaultTokenContract = getERC20Contract(vaultAddress, signer);

  // eslint-disable-next-line no-nested-ternary
  const sharesBN = shares
    ? typeof shares === 'bigint'
      ? shares
      : parseBigInt(shares, algebraVaultDecimals)
    : MaxUint256;

  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress;
  if (!depositGuardAddress) {
    throw new Error(`Deposit Guard  for vault ${vaultAddress} not found on chain ${chainId}`);
  }
  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(await vaultTokenContract.approve.estimateGas(depositGuardAddress, sharesBN));

  return vaultTokenContract.approve(depositGuardAddress, sharesBN, { gasLimit });
}

// eslint-disable-next-line no-underscore-dangle
async function _isVaultTokenApproved(
  accountAddress: string,
  shares: string | number | bigint,
  vault: AlgebraVault,
  chainId: SupportedChainId,
  jsonProvider: JsonRpcProvider,
): Promise<boolean> {
  const signer = await jsonProvider.getSigner();

  const vaultTokenContract = getERC20Contract(vault.id, signer);
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress;
  if (!depositGuardAddress) {
    throw new Error(`Deposit Guard  for vault ${vault.id} not found on chain ${chainId}`);
  }
  const currentAllowanceBN = await vaultTokenContract.allowance(accountAddress, depositGuardAddress);

  const sharesBN = typeof shares === 'bigint' ? shares : parseBigInt(shares, algebraVaultDecimals);

  return currentAllowanceBN > 0n && currentAllowanceBN >= sharesBN;
}

export async function isVaultTokenApproved(
  accountAddress: string,
  shares: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<boolean> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);
  return _isVaultTokenApproved(accountAddress, shares, vault, chainId, jsonProvider);
}

export async function withdraw(
  accountAddress: string,
  shares: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId } = await validateVaultData(vaultAddress, jsonProvider);
  const signer = await jsonProvider.getSigner();
  const vaultContract = getAlgebraVaultContract(vaultAddress, signer);

  const userShares = getUserBalance(accountAddress, vaultAddress, jsonProvider, true);
  const withdrawShares = typeof shares === 'bigint' ? shares : parseBigInt(shares, 18);
  if ((await userShares) < withdrawShares) {
    throw new Error(`Withdraw amount exceeds user shares amount in vault ${vaultAddress} on chain ${chainId}`);
  }

  const params: Parameters<typeof vaultContract.withdraw> = [
    typeof shares === 'bigint' ? shares : parseBigInt(shares, 18),
    accountAddress,
  ];
  const gasLimit = overrides?.gasLimit ?? calculateGasMargin(await vaultContract.withdraw.estimateGas(params[0], params[1]));
  
  return vaultContract.withdraw(params[0], params[1], { ...overrides, gasLimit });
}

export async function withdrawWithSlippage(
  accountAddress: string,
  shares: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  percentSlippage = 1,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);

  const signer = await jsonProvider.getSigner();

  const vaultDeployerAddress = getVaultDeployer(vaultAddress, chainId);

  // obtain Deposit Guard contract
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress;
  if (!depositGuardAddress) {
    throw new Error(`Deposit Guard  for vault ${vaultAddress} not found on chain ${chainId}`);
  }

  const userShares = getUserBalance(accountAddress, vaultAddress, jsonProvider, true);
  const withdrawShares = typeof shares === 'bigint' ? shares : parseBigInt(shares, 18);
  if ((await userShares) < withdrawShares) {
    throw new Error(`Withdraw amount exceeds user shares amount in vault ${vaultAddress} on chain ${chainId}`);
  }

  const isApproved = await _isVaultTokenApproved(accountAddress, withdrawShares, vault, chainId, jsonProvider);
  if (!isApproved) {
    throw new Error(`Vault token transfer is not approved for vault ${vaultAddress} on chain ${chainId}`);
  }

  const depositGuardContract = getAlgebraVaultDepositGuardContract(depositGuardAddress, signer);
  const maxGasLimit = getGasLimit();

  // the first call: get estimated LP amount
  let amounts = await depositGuardContract.forwardWithdrawFromAlgebraVault.staticCall(
    vaultAddress,
    vaultDeployerAddress,
    withdrawShares,
    accountAddress,
    BigInt(0),
    BigInt(0),
    {
      gasLimit: maxGasLimit,
    },
  );

  // reduce the estimated LP amount by an acceptable slippage %, default - 1%
  if (percentSlippage < 0.01) throw new Error('Slippage parameter is less than 0.01%.');
  if (percentSlippage > 100) throw new Error('Slippage parameter is more than 100%.');
  amounts = {
    0: amountWithSlippage(amounts[0], percentSlippage),
    1: amountWithSlippage(amounts[1], percentSlippage),
    amount0: amountWithSlippage(amounts[0], percentSlippage),
    amount1: amountWithSlippage(amounts[1], percentSlippage),
  } as [bigint, bigint] & { amount0: bigint; amount1: bigint };

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(
      await depositGuardContract.forwardWithdrawFromAlgebraVault.estimateGas(
        vaultAddress,
        vaultDeployerAddress,
        withdrawShares,
        accountAddress,
        amounts[0],
        amounts[1],
      ),
    );

  // the second call: actual deposit transaction
  const tx = await depositGuardContract.forwardWithdrawFromAlgebraVault(
    vaultAddress,
    vaultDeployerAddress,
    withdrawShares,
    accountAddress,
    amounts[0],
    amounts[1],
    {
      ...overrides,
      gasLimit,
    },
  );

  return tx;
}

export async function withdrawNativeToken(
  accountAddress: string,
  shares: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  percentSlippage = 1,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);

  const signer = await jsonProvider.getSigner();

  const vaultDeployerAddress = getVaultDeployer(vaultAddress, chainId);

  const userShares = getUserBalance(accountAddress, vaultAddress, jsonProvider, true);
  const withdrawShares = typeof shares === 'bigint' ? shares : parseBigInt(shares, 18);
  if ((await userShares) < withdrawShares) {
    throw new Error(`Withdraw amount exceeds user shares amount in vault ${vaultAddress} on chain ${chainId}`);
  }

  const isApproved = await _isVaultTokenApproved(accountAddress, withdrawShares, vault, chainId, jsonProvider);
  if (!isApproved) {
    throw new Error(`Vault token transfer is not approved for vault ${vaultAddress} on chain ${chainId}`);
  }

  // obtain Deposit Guard contract
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress;
  if (!depositGuardAddress) {
    throw new Error(`Deposit Guard  for vault ${vaultAddress} not found on chain ${chainId}`);
  }
  const depositGuardContract = getAlgebraVaultDepositGuardContract(depositGuardAddress, signer);
  const wrappedNative = await depositGuardContract.WRAPPED_NATIVE();
  if (
    wrappedNative.toLowerCase() !== vault.tokenA.toLowerCase() &&
    wrappedNative.toLowerCase() !== vault.tokenB.toLowerCase()
  ) {
    throw new Error('None of vault tokens is wrapped native token');
  }

  const maxGasLimit = getGasLimit();

  // the first call: get estimated LP amount
  let amounts = await depositGuardContract.forwardNativeWithdrawFromAlgebraVault.staticCall(
    vaultAddress,
    vaultDeployerAddress,
    withdrawShares,
    accountAddress,
    BigInt(0),
    BigInt(0),
    {
      gasLimit: maxGasLimit,
    },
  );

  // reduce the estimated LP amount by an acceptable slippage %, default - 1%
  if (percentSlippage < 0.01) throw new Error('Slippage parameter is less than 0.01%.');
  if (percentSlippage > 100) throw new Error('Slippage parameter is more than 100%.');
  amounts = {
    0: amountWithSlippage(amounts[0], percentSlippage),
    1: amountWithSlippage(amounts[1], percentSlippage),
    amount0: amountWithSlippage(amounts[0], percentSlippage),
    amount1: amountWithSlippage(amounts[1], percentSlippage),
  } as [bigint, bigint] & { amount0: bigint; amount1: bigint };

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(
      await depositGuardContract.forwardNativeWithdrawFromAlgebraVault.estimateGas(
        vaultAddress,
        vaultDeployerAddress,
        withdrawShares,
        accountAddress,
        amounts[0],
        amounts[1],
      ),
    );

  // the second call: actual deposit transaction
  const tx = await depositGuardContract.forwardNativeWithdrawFromAlgebraVault(
    vaultAddress,
    vaultDeployerAddress,
    withdrawShares,
    accountAddress,
    amounts[0],
    amounts[1],
    {
      ...overrides,
      gasLimit,
    },
  );

  return tx;
}
