import { ContractTransaction, Overrides } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { MaxUint256 } from '@ethersproject/constants';
import { BigNumber } from 'ethers';
import { getDepositGuardContract, getERC20Contract, getIchiVaultContract } from '../contracts';
import parseBigInt from '../utils/parseBigInt';
import { SupportedDex, SupportedChainId, IchiVault } from '../types';
import { calculateGasMargin, getGasLimit } from '../types/calculateGasMargin';
// eslint-disable-next-line import/no-cycle
import { getIchiVaultInfo, validateVaultData } from './vault';
import { addressConfig } from '../utils/config/addresses';
import amountWithSlippage from '../utils/amountWithSlippage';
import getVaultDeployer from './vaultBasics';
import { getTokenDecimals } from './_totalBalances';

export async function isTokenAllowed(
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<boolean> {
  const { chainId } = await jsonProvider.getNetwork();
  if (!Object.values(SupportedChainId).includes(chainId)) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const vault = await getIchiVaultInfo(chainId, dex, vaultAddress, jsonProvider);
  if (!vault) throw new Error(`Vault ${vaultAddress} not found on chain ${chainId} and dex ${dex}`);

  const tokenAllowed = vault[tokenIdx === 0 ? 'allowTokenA' : 'allowTokenB'];

  return tokenAllowed;
}

// eslint-disable-next-line no-underscore-dangle
async function _isDepositTokenApproved(
  accountAddress: string,
  tokenIdx: 0 | 1,
  amount: string | number | BigNumber,
  vault: IchiVault,
  chainId: SupportedChainId,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<boolean> {
  const token = vault[tokenIdx === 0 ? 'tokenA' : 'tokenB'];

  const tokenContract = getERC20Contract(token, jsonProvider);
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]![dex]?.depositGuard.address ?? '';
  const currentAllowanceBN = await tokenContract.allowance(accountAddress, depositGuardAddress);
  const tokenDecimals = await tokenContract.decimals();

  const amountBN = amount instanceof BigNumber ? amount : parseBigInt(amount, tokenDecimals);

  return currentAllowanceBN.gt(BigNumber.from(0)) && currentAllowanceBN.gte(amountBN);
}

export async function isDepositTokenApproved(
  accountAddress: string,
  tokenIdx: 0 | 1,
  amount: string | number | BigNumber,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<boolean> {
  const { vault, chainId } = await validateVaultData(vaultAddress, jsonProvider, dex);
  return _isDepositTokenApproved(accountAddress, tokenIdx, amount, vault, chainId, jsonProvider, dex);
}

export async function approveDepositToken(
  accountAddress: string,
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  amount?: string | number | BigNumber,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider, dex);

  const signer = jsonProvider.getSigner(accountAddress);

  const token = vault[tokenIdx === 0 ? 'tokenA' : 'tokenB'];

  const tokenContract = getERC20Contract(token, signer);
  const tokenDecimals = await tokenContract.decimals();

  // eslint-disable-next-line no-nested-ternary
  const amountBN = amount
    ? amount instanceof BigNumber
      ? amount
      : parseBigInt(amount, +tokenDecimals || 18)
    : MaxUint256;

  const depositGuardAddress = addressConfig[chainId as SupportedChainId]![dex]?.depositGuard.address ?? '';
  const gasLimit =
    overrides?.gasLimit ?? calculateGasMargin(await tokenContract.estimateGas.approve(depositGuardAddress, amountBN));

  return tokenContract.approve(depositGuardAddress, amountBN, { gasLimit });
}

// eslint-disable-next-line no-underscore-dangle
export async function _getMaxDepositAmount(
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<BigNumber> {
  const vaultContract = getIchiVaultContract(vaultAddress, jsonProvider);

  const maxDepositAmount = tokenIdx === 0 ? vaultContract.deposit0Max() : vaultContract.deposit1Max();

  return maxDepositAmount;
}

export async function getMaxDepositAmount(
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<BigNumber> {
  await validateVaultData(vaultAddress, jsonProvider, dex);

  const maxDepositAmount = _getMaxDepositAmount(tokenIdx, vaultAddress, jsonProvider);

  return maxDepositAmount;
}

export async function deposit(
  accountAddress: string,
  amount0: string | number | BigNumber,
  amount1: string | number | BigNumber,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  percentSlippage = 1,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider, dex);
  const signer = jsonProvider.getSigner(accountAddress);
  console.log('finding vault deployer for: ', vaultAddress, chainId, dex);
  const vaultDeployerAddress = getVaultDeployer(vaultAddress, chainId, dex);

  const token0 = vault.tokenA;
  const token1 = vault.tokenB;
  const isToken0Allowed = vault.allowTokenA;
  const isToken1Allowed = vault.allowTokenB;
  const token0Decimals = await getTokenDecimals(token0, jsonProvider, chainId);
  const token1Decimals = await getTokenDecimals(token1, jsonProvider, chainId);
  const amount0BN = amount0 instanceof BigNumber ? amount0 : parseBigInt(amount0, +token0Decimals);
  const amount1BN = amount1 instanceof BigNumber ? amount1 : parseBigInt(amount1, +token1Decimals);
  if (!isToken0Allowed && amount0BN.gt(BigNumber.from(0))) {
    throw new Error(`Deposit of token0 is not allowed: ${chainId}, ${vaultAddress}`);
  }
  if (!isToken1Allowed && amount1BN.gt(BigNumber.from(0))) {
    throw new Error(`Deposit of token1 is not allowed: chain ${chainId}, vault ${vaultAddress}`);
  }
  let depositAmount = amount0BN;
  let depositToken = token0;
  let tokenIndex = 0 as 0 | 1;
  if (amount1BN.gt(BigNumber.from(0))) {
    depositAmount = amount1BN;
    depositToken = token1;
    tokenIndex = 1;
  }
  const amountBN = isToken0Allowed ? amount0BN : amount1BN;

  const isApproved = await _isDepositTokenApproved(
    accountAddress,
    tokenIndex,
    amountBN,
    vault,
    chainId,
    jsonProvider,
    dex,
  );
  if (!isApproved) {
    throw new Error(`Deposit is not approved for token: ${depositToken}, chain ${chainId}, vault ${vaultAddress}`);
  }

  const tokenContract = getERC20Contract(depositToken, jsonProvider);
  const userTokenBalance = await tokenContract.balanceOf(accountAddress);

  if (userTokenBalance.lt(depositAmount)) {
    throw new Error(`Deposit amount exceeds user token amount for token: ${depositToken}, chain ${chainId}`);
  }

  const maxDeposit0 = await _getMaxDepositAmount(0, vaultAddress, jsonProvider);
  const maxDeposit1 = await _getMaxDepositAmount(1, vaultAddress, jsonProvider);
  if (amount0BN.gt(maxDeposit0) || amount0BN.gt(maxDeposit1)) {
    throw new Error(`Deposit amount exceeds max deposit amount: vault ${vaultAddress}, chain ${chainId}`);
  }

  // obtain Deposit Guard contract
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]![dex]?.depositGuard.address ?? '';
  const depositGuardContract = getDepositGuardContract(depositGuardAddress, signer);
  const maxGasLimit = getGasLimit();

  // the first call: get estimated LP amount
  let lpAmount = await depositGuardContract.callStatic.forwardDepositToAlgebraVault(
    vaultAddress,
    vaultDeployerAddress,
    depositToken,
    depositAmount,
    BigNumber.from(0),
    accountAddress,
    {
      gasLimit: maxGasLimit,
    },
  );

  // reduce the estimated LP amount by an acceptable slippage %, for example 1%
  if (percentSlippage < 0.01) throw new Error('Slippage parameter is less than 0.01%.');
  if (percentSlippage > 100) throw new Error('Slippage parameter is more than 100%.');
  lpAmount = lpAmount.mul(Math.floor((100 - percentSlippage) * 1000)).div(100000);

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(
      await depositGuardContract.estimateGas.forwardDepositToAlgebraVault(
        vaultAddress,
        vaultDeployerAddress,
        depositToken,
        depositAmount,
        lpAmount,
        accountAddress,
      ),
    );

  // the second call: actual deposit transaction
  const tx = await depositGuardContract.forwardDepositToAlgebraVault(
    vaultAddress,
    vaultDeployerAddress,
    depositToken,
    depositAmount,
    lpAmount,
    accountAddress,
    {
      ...overrides,
      gasLimit,
    },
  );

  return tx;
}

export async function depositNativeToken(
  accountAddress: string,
  amount0: string | number | BigNumber,
  amount1: string | number | BigNumber,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  percentSlippage = 1,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider, dex);
  // if (chainId === SupportedChainId.celo) {
  //   throw new Error(`This function is not supported on chain ${chainId}`);
  // }
  if (addressConfig[chainId as SupportedChainId][dex]?.depositGuard.version !== 2) {
    throw new Error(`Unsupported function for vault ${vaultAddress} on chain ${chainId} and dex ${dex}`);
  }
  const signer = jsonProvider.getSigner(accountAddress);
  const vaultDeployerAddress = getVaultDeployer(vaultAddress, chainId, dex);

  const token0 = vault.tokenA;
  const token1 = vault.tokenB;
  const isToken0Allowed = vault.allowTokenA;
  const isToken1Allowed = vault.allowTokenB;
  const token0Contract = getERC20Contract(token0, signer);
  const token1Contract = getERC20Contract(token1, signer);
  const token0Decimals = await token0Contract.decimals();
  const token1Decimals = await token1Contract.decimals();
  const amount0BN = amount0 instanceof BigNumber ? amount0 : parseBigInt(amount0, +token0Decimals);
  const amount1BN = amount1 instanceof BigNumber ? amount1 : parseBigInt(amount1, +token1Decimals);
  if (!isToken0Allowed && amount0BN > BigNumber.from(0)) {
    throw new Error(`Deposit of token0 is not allowed: ${chainId}, ${vaultAddress}`);
  }
  if (!isToken1Allowed && amount1BN > BigNumber.from(0)) {
    throw new Error(`Deposit of token1 is not allowed: ${chainId}, ${vaultAddress}`);
  }
  let depositAmount = amount0BN;
  let depositToken = token0;
  if (amount1BN > BigNumber.from(0)) {
    depositAmount = amount1BN;
    depositToken = token1;
  }

  // obtain Deposit Guard contract
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]![dex]?.depositGuard.address;
  if (!depositGuardAddress) {
    throw new Error(`Deposit Guard not found for vault ${vaultAddress} on chain ${chainId} and dex ${dex}`);
  }
  const depositGuardContract = getDepositGuardContract(depositGuardAddress, signer);
  const wrappedNative = await depositGuardContract.WRAPPED_NATIVE();
  if (wrappedNative.toLowerCase() !== depositToken.toLowerCase()) {
    throw new Error('Deposit token is not wrapped native token');
  }

  const userNativeTokenBalance = await jsonProvider.getBalance(accountAddress);
  if (userNativeTokenBalance.lt(depositAmount)) {
    throw new Error(`Deposit amount exceeds user native token amount on chain ${chainId}`);
  }

  const maxGasLimit = getGasLimit();

  // if (chainId === SupportedChainId.hedera) {
  //   depositAmount = depositAmount.mul(BigNumber.from(1e10));
  // }

  // the first call: get estimated LP amount
  let lpAmount = await depositGuardContract.callStatic.forwardNativeDepositToAlgebraVault(
    vaultAddress,
    vaultDeployerAddress,
    BigNumber.from(0),
    accountAddress,
    {
      value: depositAmount,
      gasLimit: maxGasLimit,
    },
  );

  // reduce the estimated LP amount by an acceptable slippage %, for example 1%
  if (percentSlippage < 0.01) throw new Error('Slippage parameter is less than 0.01%.');
  if (percentSlippage > 100) throw new Error('Slippage parameter is more than 100%.');
  lpAmount = amountWithSlippage(lpAmount, percentSlippage);

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(
      await depositGuardContract.estimateGas.forwardNativeDepositToAlgebraVault(
        vaultAddress,
        vaultDeployerAddress,
        lpAmount,
        accountAddress,
        {
          value: depositAmount,
        },
      ),
    );

  // the second call: actual deposit transaction
  const tx = await depositGuardContract.forwardNativeDepositToAlgebraVault(
    vaultAddress,
    vaultDeployerAddress,
    lpAmount,
    accountAddress,
    {
      value: depositAmount,
      ...overrides,
      gasLimit,
    },
  );

  return tx;
}
