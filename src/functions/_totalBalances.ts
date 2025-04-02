/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-underscore-dangle */

import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import { getERC20Contract, getAlgebraVaultContract } from '../contracts';
import { AlgebraVault, SupportedChainId, TotalAmounts, TotalAmountsBN, algebraVaultDecimals } from '../types';
import formatBigInt from '../utils/formatBigInt';
// eslint-disable-next-line import/no-cycle
import cache from '../utils/cache';

export async function getTokenDecimals(
  tokenAddress: string,
  jsonProvider: JsonRpcProvider,
  chainId: SupportedChainId,
): Promise<number> {
  const key = `token-${chainId}-${tokenAddress}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as number;
  }
  const ttl = 24 * 60 * 60 * 1000;
  try {
    const tokenContract = getERC20Contract(tokenAddress, jsonProvider);
    const tokenDecimals = await tokenContract.decimals();
    cache.set(key, tokenDecimals, ttl);
    return tokenDecimals;
  } catch (error) {
    console.error(error);
    throw new Error(`Could not get token decimals for ${tokenAddress} on ${chainId}`);
  }
}

export async function _getTotalAmounts(
  vault: AlgebraVault,
  jsonProvider: JsonRpcProvider,
  raw: false,
  token0Decimals: number,
  token1Decimals: number,
): Promise<TotalAmounts>;

export async function _getTotalAmounts(
  vault: AlgebraVault,
  jsonProvider: JsonRpcProvider,
  raw: true,
  token0Decimals: number,
  token1Decimals: number,
): Promise<TotalAmountsBN>;

export async function _getTotalAmounts(
  vault: AlgebraVault,
  jsonProvider: JsonRpcProvider,
  raw: boolean,
  token0Decimals: number,
  token1Decimals: number,
) {
  const vaultContract = getAlgebraVaultContract(vault.id, jsonProvider);
  const totalAmountsBN = await vaultContract.getTotalAmounts();

  if (!raw) {
    const totalAmounts = {
      total0: formatBigInt(totalAmountsBN.total0, token0Decimals),
      total1: formatBigInt(totalAmountsBN.total1, token1Decimals),
      0: formatBigInt(totalAmountsBN.total0, token0Decimals),
      1: formatBigInt(totalAmountsBN.total1, token1Decimals),
    } as TotalAmounts;
    return totalAmounts;
  }

  return totalAmountsBN;
}

export async function _getTotalSupply(vaultAddress: string, jsonProvider: JsonRpcProvider): Promise<string>;

export async function _getTotalSupply(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: true,
): Promise<BigNumber>;

export async function _getTotalSupply(vaultAddress: string, jsonProvider: JsonRpcProvider, raw?: true) {
  try {
    const vaultContract = getAlgebraVaultContract(vaultAddress, jsonProvider);
    const totalSupply = await vaultContract.totalSupply();

    return raw ? totalSupply : formatBigInt(totalSupply, algebraVaultDecimals);
  } catch (error) {
    console.error(error);
    throw new Error(`Could not get total supply for ${vaultAddress}`);
  }
}
