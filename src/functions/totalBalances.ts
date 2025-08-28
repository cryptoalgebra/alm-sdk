/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */

import { JsonRpcProvider } from 'ethers';
// Removed bigint from ethers - using native bigint;
import { TotalAmounts, TotalAmountsBN } from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { _getTotalAmounts, _getTotalSupply } from './_totalBalances';

export async function getTotalAmounts(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: false,
  token0Decimals: number,
  token1Decimals: number,
): Promise<TotalAmounts>;

export async function getTotalAmounts(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: true,
  token0Decimals: number,
  token1Decimals: number,
): Promise<TotalAmountsBN>;

export async function getTotalAmounts(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: boolean,
  token0Decimals: number,
  token1Decimals: number,
) {
  const { vault } = await validateVaultData(vaultAddress, jsonProvider);

  if (!raw) {
    return _getTotalAmounts(vault, jsonProvider, token0Decimals, token1Decimals, false);
  }
  return _getTotalAmounts(vault, jsonProvider, token0Decimals, token1Decimals, true);
}

export async function getTotalSupply(vaultAddress: string, jsonProvider: JsonRpcProvider): Promise<string>;

export async function getTotalSupply(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: true,
): Promise<bigint>;

export async function getTotalSupply(vaultAddress: string, jsonProvider: JsonRpcProvider, raw?: true) {
  await validateVaultData(vaultAddress, jsonProvider);

  if (!raw) {
    return _getTotalSupply(vaultAddress, jsonProvider);
  }
  return _getTotalSupply(vaultAddress, jsonProvider, true);
}
