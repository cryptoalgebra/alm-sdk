/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */

import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import { SupportedDex, TotalAmounts, TotalAmountsBN } from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { _getTotalAmounts, _getTotalSupply } from './_totalBalances';

export async function getTotalAmounts(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: false,
  token0Decimals: number,
  token1Decimals: number,
): Promise<TotalAmounts>;

export async function getTotalAmounts(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: true,
  token0Decimals: number,
  token1Decimals: number,
): Promise<TotalAmountsBN>;

export async function getTotalAmounts(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: boolean,
  token0Decimals: number,
  token1Decimals: number,
) {
  const { vault } = await validateVaultData(vaultAddress, jsonProvider, dex);

  if (!raw) {
    return _getTotalAmounts(vault, jsonProvider, false, token0Decimals, token1Decimals);
  }
  return _getTotalAmounts(vault, jsonProvider, true, token0Decimals, token1Decimals);
}

export async function getTotalSupply(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<string>;

export async function getTotalSupply(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: true,
): Promise<BigNumber>;

export async function getTotalSupply(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw?: true,
) {
  await validateVaultData(vaultAddress, jsonProvider, dex);

  if (!raw) {
    return _getTotalSupply(vaultAddress, jsonProvider);
  }
  return _getTotalSupply(vaultAddress, jsonProvider, true);
}
