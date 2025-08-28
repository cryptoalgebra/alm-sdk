import { ContractTransactionResponse, JsonRpcProvider, MaxUint256, Overrides } from 'ethers';
import { getAlgebraVaultDepositGuardContract, getERC20Contract, getAlgebraVaultContract } from '../contracts';
import parseBigInt from '../utils/parseBigInt';
import { SupportedChainId, AlgebraVault } from '../types';
import { calculateGasMargin, getGasLimit } from '../types/calculateGasMargin';
// eslint-disable-next-line import/no-cycle
import { getAlgebraVaultInfo, validateVaultData } from './vault';
import { addressConfig } from '../config/addresses';
import amountWithSlippage from '../utils/amountWithSlippage';
import getVaultDeployer from './vaultBasics';
import { getTokenDecimals } from './_totalBalances';

export async function isTokenAllowed(
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<boolean> {
  const network = await jsonProvider.getNetwork(); const chainId = Number(network.chainId);
  if (!Object.values(SupportedChainId).includes(chainId)) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const vault = await getAlgebraVaultInfo(chainId, vaultAddress, jsonProvider);
  if (!vault) throw new Error(`Vault ${vaultAddress} not found on chain ${chainId}`);

  const tokenAllowed = vault[tokenIdx === 0 ? 'allowTokenA' : 'allowTokenB'];

  return tokenAllowed;
}

// eslint-disable-next-line no-underscore-dangle
async function _isDepositTokenApproved(
  accountAddress: string,
  tokenIdx: 0 | 1,
  amount: string | number | bigint,
  vault: AlgebraVault,
  chainId: SupportedChainId,
  jsonProvider: JsonRpcProvider,
): Promise<boolean> {
  const token = vault[tokenIdx === 0 ? 'tokenA' : 'tokenB'];

  const tokenContract = getERC20Contract(token, jsonProvider);
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress ?? '';
  const currentAllowanceBN = await tokenContract.allowance(accountAddress, depositGuardAddress);
  const tokenDecimals = await tokenContract.decimals();

  const amountBN = typeof amount === 'bigint' ? amount : parseBigInt(amount, Number(tokenDecimals));

  return currentAllowanceBN > 0n && currentAllowanceBN >= amountBN;
}

export async function isDepositTokenApproved(
  accountAddress: string,
  tokenIdx: 0 | 1,
  amount: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<boolean> {
  const { vault, chainId } = await validateVaultData(vaultAddress, jsonProvider);
  return _isDepositTokenApproved(accountAddress, tokenIdx, amount, vault, chainId, jsonProvider);
}

export async function approveDepositToken(
  accountAddress: string,
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  amount?: string | number | bigint,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);

  const signer = await jsonProvider.getSigner();

  const token = vault[tokenIdx === 0 ? 'tokenA' : 'tokenB'];

  const tokenContract = getERC20Contract(token, signer);
  const tokenDecimals = await tokenContract.decimals();

  // eslint-disable-next-line no-nested-ternary
  const amountBN = amount
    ? typeof amount === 'bigint' 
      ? amount
      : parseBigInt(amount, Number(tokenDecimals) || 18)
    : MaxUint256;

  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress ?? '';
  const gasLimit =
    overrides?.gasLimit ?? calculateGasMargin(await tokenContract.approve.estimateGas(depositGuardAddress, amountBN));

  return tokenContract.approve(depositGuardAddress, amountBN, { gasLimit });
}

// eslint-disable-next-line no-underscore-dangle
export async function _getMaxDepositAmount(
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<bigint> {
  const vaultContract = getAlgebraVaultContract(vaultAddress, jsonProvider);

  const maxDepositAmount = tokenIdx === 0 ? vaultContract.deposit0Max() : vaultContract.deposit1Max();

  return maxDepositAmount;
}

export async function getMaxDepositAmount(
  tokenIdx: 0 | 1,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<bigint> {
  await validateVaultData(vaultAddress, jsonProvider);

  const maxDepositAmount = _getMaxDepositAmount(tokenIdx, vaultAddress, jsonProvider);

  return maxDepositAmount;
}

export async function deposit(
  accountAddress: string,
  amount0: string | number | bigint,
  amount1: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  percentSlippage = 1,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);
  const signer = await jsonProvider.getSigner();
  console.log('finding vault deployer for: ', vaultAddress, chainId);
  const vaultDeployerAddress = getVaultDeployer(vaultAddress, chainId);

  const token0 = vault.tokenA;
  const token1 = vault.tokenB;
  const isToken0Allowed = vault.allowTokenA;
  const isToken1Allowed = vault.allowTokenB;
  const token0Decimals = await getTokenDecimals(token0, jsonProvider, chainId);
  const token1Decimals = await getTokenDecimals(token1, jsonProvider, chainId);
  const amount0BN = typeof amount0 === 'bigint' ? amount0 : parseBigInt(amount0, Number(token0Decimals));
  const amount1BN = typeof amount1 === 'bigint' ? amount1 : parseBigInt(amount1, Number(token1Decimals));
  if (!isToken0Allowed && amount0BN > 0n) {
    throw new Error(`Deposit of token0 is not allowed: ${chainId}, ${vaultAddress}`);
  }
  if (!isToken1Allowed && amount1BN > 0n) {
    throw new Error(`Deposit of token1 is not allowed: chain ${chainId}, vault ${vaultAddress}`);
  }
  let depositAmount = amount0BN;
  let depositToken = token0;
  let tokenIndex = 0 as 0 | 1;
  if (amount1BN > 0n) {
    depositAmount = amount1BN;
    depositToken = token1;
    tokenIndex = 1;
  }
  const amountBN = isToken0Allowed ? amount0BN : amount1BN;

  const isApproved = await _isDepositTokenApproved(accountAddress, tokenIndex, amountBN, vault, chainId, jsonProvider);
  if (!isApproved) {
    throw new Error(`Deposit is not approved for token: ${depositToken}, chain ${chainId}, vault ${vaultAddress}`);
  }

  const tokenContract = getERC20Contract(depositToken, jsonProvider);
  const userTokenBalance = await tokenContract.balanceOf(accountAddress);

  if (userTokenBalance < depositAmount) {
    throw new Error(`Deposit amount exceeds user token amount for token: ${depositToken}, chain ${chainId}`);
  }

  const maxDeposit0 = await _getMaxDepositAmount(0, vaultAddress, jsonProvider);
  const maxDeposit1 = await _getMaxDepositAmount(1, vaultAddress, jsonProvider);
  if (amount0BN > maxDeposit0 || amount0BN > maxDeposit1) {
    throw new Error(`Deposit amount exceeds max deposit amount: vault ${vaultAddress}, chain ${chainId}`);
  }

  // obtain Deposit Guard contract
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress ?? '';
  const depositGuardContract = getAlgebraVaultDepositGuardContract(depositGuardAddress, signer);
  const maxGasLimit = getGasLimit();

  // the first call: get estimated LP amount
  let lpAmount = await depositGuardContract.forwardDepositToAlgebraVault.staticCall(
    vaultAddress,
    vaultDeployerAddress,
    depositToken,
    depositAmount,
    0n,
    accountAddress,
    {
      gasLimit: maxGasLimit,
    },
  );

  // reduce the estimated LP amount by an acceptable slippage %, for example 1%
  if (percentSlippage < 0.01) throw new Error('Slippage parameter is less than 0.01%.');
  if (percentSlippage > 100) throw new Error('Slippage parameter is more than 100%.');
  lpAmount = (lpAmount * BigInt(Math.floor((100 - percentSlippage) * 1000))) / 100000n;

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(
      await depositGuardContract.forwardDepositToAlgebraVault.estimateGas(
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
  amount0: string | number | bigint,
  amount1: string | number | bigint,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  percentSlippage = 1,
  overrides?: Overrides,
): Promise<ContractTransactionResponse> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);
  // if (chainId === SupportedChainId.celo) {
  //   throw new Error(`This function is not supported on chain ${chainId}`);
  // }

  const signer = await jsonProvider.getSigner();
  const vaultDeployerAddress = getVaultDeployer(vaultAddress, chainId);

  const token0 = vault.tokenA;
  const token1 = vault.tokenB;
  const isToken0Allowed = vault.allowTokenA;
  const isToken1Allowed = vault.allowTokenB;
  const token0Contract = getERC20Contract(token0, signer);
  const token1Contract = getERC20Contract(token1, signer);
  const token0Decimals = await token0Contract.decimals();
  const token1Decimals = await token1Contract.decimals();
  const amount0BN = typeof amount0 === 'bigint' ? amount0 : parseBigInt(amount0, Number(token0Decimals));
  const amount1BN = typeof amount1 === 'bigint' ? amount1 : parseBigInt(amount1, Number(token1Decimals));
  if (!isToken0Allowed && amount0BN > 0n) {
    throw new Error(`Deposit of token0 is not allowed: ${chainId}, ${vaultAddress}`);
  }
  if (!isToken1Allowed && amount1BN > 0n) {
    throw new Error(`Deposit of token1 is not allowed: ${chainId}, ${vaultAddress}`);
  }
  let depositAmount = amount0BN;
  let depositToken = token0;
  if (amount1BN > 0n) {
    depositAmount = amount1BN;
    depositToken = token1;
  }

  // obtain Deposit Guard contract
  const depositGuardAddress = addressConfig[chainId as SupportedChainId]?.depositGuardAddress;
  if (!depositGuardAddress) {
    throw new Error(`Deposit Guard not found for vault ${vaultAddress} on chain ${chainId}`);
  }
  const depositGuardContract = getAlgebraVaultDepositGuardContract(depositGuardAddress, signer);
  const wrappedNative = await depositGuardContract.WRAPPED_NATIVE();
  if (wrappedNative.toLowerCase() !== depositToken.toLowerCase()) {
    throw new Error('Deposit token is not wrapped native token');
  }

  const userNativeTokenBalance = await jsonProvider.getBalance(accountAddress);
  if (userNativeTokenBalance < depositAmount) {
    throw new Error(`Deposit amount exceeds user native token amount on chain ${chainId}`);
  }

  const maxGasLimit = getGasLimit();

  // if (chainId === SupportedChainId.hedera) {
  //   depositAmount = depositAmount.mul(BigInt(1e10));
  // }

  // the first call: get estimated LP amount
  let lpAmount = await depositGuardContract.forwardNativeDepositToAlgebraVault.staticCall(
    vaultAddress,
    vaultDeployerAddress,
    0n,
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
      await depositGuardContract.forwardNativeDepositToAlgebraVault.estimateGas(
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
