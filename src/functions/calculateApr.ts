import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import {
  AlgebraVault,
  PriceChange,
  SupportedDex,
  TotalAmountsBN,
  VaultApr,
  VaultState,
  algebraVaultDecimals,
} from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { getTokenDecimals } from './_totalBalances';
import { getCurrLpPrice, getVaultTvl } from './priceFromPool';
import { millisecondsToDays } from '../utils/timestamps';
import getPrice from '../utils/getPrice';
import formatBigInt from '../utils/formatBigInt';
import getGraphUrls from '../utils/getGraphUrls';
// eslint-disable-next-line import/no-cycle
import { _getAllVaultEvents, getVaultStateAt } from './_vaultEvents';
import cache from '../utils/cache';

export function getLpPriceAt(
  vaultEvents: VaultState[],
  daysAgo: number,
  isVaultInverted: boolean,
  token0decimals: number,
  token1decimals: number,
): PriceChange | null {
  const e = getVaultStateAt(vaultEvents, daysAgo);
  if (!e) {
    return null;
  } else {
    const depositTokenDecimals = isVaultInverted ? token1decimals : token0decimals;
    const scarceTokenDecimals = isVaultInverted ? token0decimals : token1decimals;

    const { totalAmount0, totalAmount1, sqrtPrice } = e;
    const formattedTotalAmount0 = formatBigInt(totalAmount0, token0decimals);
    const formattedTotalAmount1 = formatBigInt(totalAmount1, token1decimals);
    const price = getPrice(isVaultInverted, BigNumber.from(sqrtPrice), depositTokenDecimals, scarceTokenDecimals, 15);
    const tvl = !isVaultInverted
      ? Number(formattedTotalAmount0) + Number(formattedTotalAmount1) * price
      : Number(formattedTotalAmount1) + Number(formattedTotalAmount0) * price;
    const totalSupply = Number(formatBigInt(e.totalSupply, algebraVaultDecimals));
    const days = millisecondsToDays(Date.now() - Number(e.createdAtTimestamp) * 1000);
    if (totalSupply === 0) {
      return null;
    }
    return { timeInterval: days, priceChange: tvl / totalSupply };
  }
}

export async function getLpApr(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  vault: AlgebraVault,
  token0Decimals: number,
  token1Decimals: number,
  // timeIntervals?: number[],
): Promise<{ aprs: (VaultApr | null)[]; vault: AlgebraVault; tvl: number; totalAmounts: TotalAmountsBN }> {
  const key = `lpApr-${dex}-${vaultAddress}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as { aprs: (VaultApr | null)[]; vault: AlgebraVault; tvl: number; totalAmounts: TotalAmountsBN };
  }
  const ttl = 30 * 60 * 1000;

  const isInv = vault.allowTokenB;

  const { tvl, totalAmounts } = await getVaultTvl(vault, jsonProvider, isInv, token0Decimals, token1Decimals);
  // const totalSupply = await _getTotalSupply(vault.id, jsonProvider);

  // if (Number(totalSupply) === 0) {
  //   throw new Error(`Could not get LP price. Vault total supply is 0 for vault ${vault.id} on chain ${chainId}`);
  // }
  // const currLpPrice = tvl / Number(totalSupply);

  // const arrDays = timeIntervals && timeIntervals.length > 0 ? timeIntervals : [1, 7, 30];
  // const maxDays = Math.max(...arrDays) + 30;

  const vaultAprs = [] as VaultApr[];
  // const vaultEvents = await _getAllVaultEvents(vaultAddress, chainId, dex, maxDays);

  // arrDays.forEach((d) => {
  //   const objLpPrice = getLpPriceAt(vaultEvents, d, isInv, decimals0, decimals1);
  //   if (!objLpPrice?.priceChange) {
  //     vaultAprs.push({ timeInterval: d, apr: null });
  //   } else {
  //     const days = objLpPrice.timeInterval;
  //     const apr = ((currLpPrice - objLpPrice.priceChange) / ((objLpPrice.priceChange * days) / 365)) * 100;
  //     vaultAprs.push({ timeInterval: d, apr });
  //   }
  // });

  const result = {
    aprs: vaultAprs,
    vault,
    tvl,
    totalAmounts,
  };

  cache.set(key, result, ttl);
  return result;
}

export async function getLpPriceChange(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  timeIntervals?: number[],
): Promise<(PriceChange | null)[]> {
  const key = `lpPriceChange-${dex}-${vaultAddress}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as (PriceChange | null)[];
  }
  const ttl = 30 * 60 * 1000;

  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider, dex);
  getGraphUrls(chainId, dex, true);

  const decimals0 = await getTokenDecimals(vault.tokenA, jsonProvider, chainId);
  const decimals1 = await getTokenDecimals(vault.tokenB, jsonProvider, chainId);
  const isInv = vault.allowTokenB;

  const currLpPrice = await getCurrLpPrice(vault, jsonProvider, dex, chainId, isInv, decimals0, decimals1);

  const arrDays = timeIntervals && timeIntervals.length > 0 ? timeIntervals : [1, 7, 30];
  const maxDays = Math.max(...arrDays) + 30;

  const result = [] as PriceChange[];
  const vaultEvents = await _getAllVaultEvents(vaultAddress, chainId, dex, maxDays);
  arrDays.forEach((d) => {
    const objLpPrice = getLpPriceAt(vaultEvents, d, isInv, decimals0, decimals1);
    const prevLpPrice = objLpPrice?.priceChange;
    if (!prevLpPrice || prevLpPrice === 0) {
      result.push({ timeInterval: d, priceChange: null });
    } else {
      result.push({ timeInterval: d, priceChange: ((currLpPrice - prevLpPrice) / prevLpPrice) * 100 });
    }
  });
  cache.set(key, result, ttl);
  return result;
}
