/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */

import { JsonRpcProvider } from 'ethers';
// Removed bigint from @ethersproject/bignumber - using native bigint;
import { AlgebraVault, SupportedChainId, TotalAmountsBN } from '../types';
// eslint-disable-next-line import/no-cycle
import { getAlgebraVaultInfo } from './vault';
import { getTotalAmounts } from './totalBalances';
import getPrice from '../utils/getPrice';
import { getAlgebraPoolContract, getAlgebraVaultContract } from '../contracts';
import { _getTotalAmounts, _getTotalSupply } from './_totalBalances';

export async function getSqrtPriceFromPool(vault: AlgebraVault, jsonProvider: JsonRpcProvider): Promise<bigint> {
  try {
    const vaultContract = getAlgebraVaultContract(vault.id, jsonProvider);
    const poolAddress: string = await vaultContract.pool();

    const poolContract = getAlgebraPoolContract(poolAddress, jsonProvider);
    const globalState = await poolContract.globalState();
    return globalState[0];
  } catch (e) {
    console.error(`Could not get price from vault ${vault.id} `);
    throw e;
  }
}

// current price in pool of scarse token in deposit tokens
export async function getCurrPrice(
  vault: AlgebraVault,
  jsonProvider: JsonRpcProvider,
  isVaultInverted: boolean,
  token0decimals: number,
  token1decimals: number,
): Promise<number> {
  try {
    const sqrtPrice = await getSqrtPriceFromPool(vault, jsonProvider);
    const depositTokenDecimals = isVaultInverted ? token1decimals : token0decimals;
    const scarceTokenDecimals = isVaultInverted ? token0decimals : token1decimals;
    const price = getPrice(isVaultInverted, sqrtPrice, depositTokenDecimals, scarceTokenDecimals, 15);

    return price;
  } catch (e) {
    console.error(`Could not get price from vault ${vault.id} `);
    throw e;
  }
}

export async function getVaultTvl(
  vault: AlgebraVault,
  jsonProvider: JsonRpcProvider,
  isVaultInverted: boolean,
  token0decimals: number,
  token1decimals: number,
): Promise<{ tvl: number; totalAmounts: TotalAmountsBN }> {
  const totalAmounts = await _getTotalAmounts(vault, jsonProvider, token0decimals, token1decimals, true);
  const price = await getCurrPrice(vault, jsonProvider, isVaultInverted, token0decimals, token1decimals);
  const tvl = !isVaultInverted
    ? Number(totalAmounts.total0) + Number(totalAmounts.total1) * price
    : Number(totalAmounts.total1) + Number(totalAmounts.total0) * price;

  return { tvl, totalAmounts };
}

// current LP price in pool in deposit tokens
export async function getCurrLpPrice(
  vault: AlgebraVault,
  jsonProvider: JsonRpcProvider,
  chainId: SupportedChainId,
  isVaultInverted: boolean,
  token0decimals: number,
  token1decimals: number,
): Promise<number> {
  try {
    const { tvl } = await getVaultTvl(vault, jsonProvider, isVaultInverted, token0decimals, token1decimals);
    const totalSupply = await _getTotalSupply(vault.id, jsonProvider);
    if (Number(totalSupply) === 0) {
      throw new Error(`Could not get LP price. Vault total supply is 0 for vault ${vault.id} on chain ${chainId}`);
    }
    const result = tvl / Number(totalSupply);
    return result;
  } catch (e) {
    console.error(`Could not get LP price from vault ${vault.id} `);
    throw e;
  }
}

// total amounts at deposit or withdrawal in deposit tokens
export async function getCurrentDtr(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  isVaultInverted: boolean,
  token0decimals: number,
  token1decimals: number,
): Promise<number> {
  const network = await jsonProvider.getNetwork(); const chainId = Number(network.chainId);

  if (!Object.values(SupportedChainId).includes(chainId)) {
    throw new Error(`Unsupported chainId: ${chainId ?? 'undefined'}`);
  }

  const vault = await getAlgebraVaultInfo(chainId, vaultAddress, jsonProvider);
  if (!vault) throw new Error(`Vault ${vaultAddress} not found on chain ${chainId}`);

  const totalAmounts = await getTotalAmounts(vaultAddress, jsonProvider, false, token0decimals, token1decimals);
  const price = await getCurrPrice(vault, jsonProvider, isVaultInverted, token0decimals, token1decimals);
  if (Number(totalAmounts.total0) + Number(totalAmounts.total1) * price === 0) return 0;
  const dtr = !isVaultInverted
    ? (Number(totalAmounts.total0) / (Number(totalAmounts.total0) + Number(totalAmounts.total1) * price)) * 100
    : (Number(totalAmounts.total1) / (Number(totalAmounts.total1) + Number(totalAmounts.total0) * price)) * 100;

  return dtr;
}
