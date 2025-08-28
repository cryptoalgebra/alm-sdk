/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */

import { JsonRpcProvider } from 'ethers';
import { parseUnits } from 'ethers';
import { AverageDepositTokenRatio, DepositTokenRatio, VaultState, VaultTransactionEvent } from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { getTokenDecimals } from './_totalBalances';
import formatBigInt from '../utils/formatBigInt';
import { daysToMilliseconds } from '../utils/timestamps';
import { isTokenAllowed } from './deposit';
import getPrice from '../utils/getPrice';
import { getTotalAmountsAtFeeCollectionEvent } from './calculateFees';
import { getCurrentDtr } from './priceFromPool';
import { _getDeposits, _getFeesCollectedEvents, _getRebalances, _getWithdraws } from './_vaultEvents';
import truncateToDecimals from '../utils/truncateToDecimals';

export function getAmountsInDepositToken(
  sqrtPrice: bigint,
  amount0: bigint,
  amount1: bigint,
  token0Decimals: number,
  token1Decimals: number,
  depositToken: 0 | 1,
): bigint {
  const isVaultInverted = depositToken === 1;

  const depositTokenDecimals = isVaultInverted ? token1Decimals : token0Decimals;
  const scarceTokenDecimals = isVaultInverted ? token0Decimals : token1Decimals;
  const price0 = !isVaultInverted
    ? 1
    : getPrice(isVaultInverted, BigInt(sqrtPrice), depositTokenDecimals, scarceTokenDecimals, 15);
  const price1 = isVaultInverted
    ? 1
    : getPrice(isVaultInverted, BigInt(sqrtPrice), depositTokenDecimals, scarceTokenDecimals, 15);

  const amountInDepositToken =
    Number(formatBigInt(amount0, token0Decimals)) * price0 + Number(formatBigInt(amount1, token1Decimals)) * price1;

  const amountStr = truncateToDecimals(amountInDepositToken, depositTokenDecimals);
  const amountInDepositTokenBN = parseUnits(amountStr, depositTokenDecimals);

  return amountInDepositTokenBN;
}

// total amounts at deposit or withdrawal in deposit tokens
function getTotalAmountsAtTransactionEvent(
  objTransactionEvent: VaultTransactionEvent,
  isVaultInverted: boolean,
  token0Decimals: number,
  token1Decimals: number,
  beforeEvent: boolean,
): [number, number] {
  const depositTokenDecimals = isVaultInverted ? token1Decimals : token0Decimals;
  const scarceTokenDecimals = isVaultInverted ? token0Decimals : token1Decimals;
  const price0 = !isVaultInverted
    ? 1
    : getPrice(
        isVaultInverted,
        BigInt(objTransactionEvent.sqrtPrice),
        depositTokenDecimals,
        scarceTokenDecimals,
        15,
      );
  const price1 = isVaultInverted
    ? 1
    : getPrice(
        isVaultInverted,
        BigInt(objTransactionEvent.sqrtPrice),
        depositTokenDecimals,
        scarceTokenDecimals,
        15,
      );
  const amount0 = beforeEvent
    ? Number(formatBigInt(BigInt(objTransactionEvent.totalAmount0BeforeEvent), token0Decimals)) * price0
    : Number(formatBigInt(BigInt(objTransactionEvent.totalAmount0), token0Decimals)) * price0;
  const amount1 = beforeEvent
    ? Number(formatBigInt(BigInt(objTransactionEvent.totalAmount1BeforeEvent), token1Decimals)) * price1
    : Number(formatBigInt(BigInt(objTransactionEvent.totalAmount1), token1Decimals)) * price1;
  return [amount0, amount1];
}

export function getDtrAtTransactionEvent(
  objTransactionEvent: VaultTransactionEvent,
  isVaultInverted: boolean,
  token0Decimals: number,
  token1Decimals: number,
  beforeEvent: boolean = false,
): DepositTokenRatio {
  const timestamp = objTransactionEvent.createdAtTimestamp;
  const totalAmounts = getTotalAmountsAtTransactionEvent(
    objTransactionEvent,
    isVaultInverted,
    token0Decimals,
    token1Decimals,
    beforeEvent,
  );
  const dtr = isVaultInverted
    ? (totalAmounts[1] / (totalAmounts[0] + totalAmounts[1])) * 100
    : (totalAmounts[0] / (totalAmounts[0] + totalAmounts[1])) * 100;
  return { atTimestamp: timestamp, percent: dtr };
}

export function getDtrAtFeeCollectionEvent(
  objFeeCollectionEvent: VaultState,
  isVaultInverted: boolean,
  token0Decimals: number,
  token1Decimals: number,
): DepositTokenRatio {
  const timestamp = objFeeCollectionEvent.createdAtTimestamp;
  const totalAmounts = getTotalAmountsAtFeeCollectionEvent(
    objFeeCollectionEvent,
    isVaultInverted,
    token0Decimals,
    token1Decimals,
  );
  const dtr = isVaultInverted
    ? (totalAmounts[1] / (totalAmounts[0] + totalAmounts[1])) * 100
    : (totalAmounts[0] / (totalAmounts[0] + totalAmounts[1])) * 100;
  return { atTimestamp: timestamp, percent: dtr };
}

// time Interval in days
export async function getAllDtrsForTimeInterval(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  timeInterval: number,
): Promise<DepositTokenRatio[]> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider);
  const token0Decimals = await getTokenDecimals(vault.tokenA, jsonProvider, chainId);
  const token1Decimals = await getTokenDecimals(vault.tokenB, jsonProvider, chainId);
  const isVaultInverted = await isTokenAllowed(1, vaultAddress, jsonProvider);

  const rebalances = await _getRebalances(vaultAddress, chainId, timeInterval);
  if (!rebalances) throw new Error(`Error getting vault rebalances on ${chainId} for ${vaultAddress}`);
  const collectedFees = await _getFeesCollectedEvents(vaultAddress, chainId, timeInterval);
  if (!collectedFees) throw new Error(`Error getting vault collected fees on ${chainId} for ${vaultAddress}`);
  const deposits = await _getDeposits(vaultAddress, chainId, timeInterval);
  if (!deposits) throw new Error(`Error getting vault deposits on ${chainId} for ${vaultAddress}`);
  const withdraws = await _getWithdraws(vaultAddress, chainId, timeInterval);
  if (!withdraws) throw new Error(`Error getting vault withdraws on ${chainId} for ${vaultAddress}`);

  const arrRebalances = rebalances
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(timeInterval))
    .map((e) => getDtrAtFeeCollectionEvent(e, isVaultInverted, token0Decimals, token1Decimals));
  const arrOtherFees = collectedFees
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(timeInterval))
    .map((e) => getDtrAtFeeCollectionEvent(e, isVaultInverted, token0Decimals, token1Decimals));
  const arrDeposits = deposits
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(timeInterval))
    .map((e) => getDtrAtTransactionEvent(e, isVaultInverted, token0Decimals, token1Decimals));
  const arrWithdraws = withdraws
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(timeInterval))
    .map((e) => getDtrAtTransactionEvent(e, isVaultInverted, token0Decimals, token1Decimals));
  const currentDtr = {
    atTimestamp: Math.floor(Date.now() / 1000).toString(),
    percent: await getCurrentDtr(vaultAddress, jsonProvider, isVaultInverted, token0Decimals, token1Decimals),
  } as DepositTokenRatio;

  const result = [...arrDeposits, ...arrWithdraws, ...arrRebalances, ...arrOtherFees, currentDtr].sort(
    (a, b) => Number(b.atTimestamp) - Number(a.atTimestamp), // recent events first, starting with current value
  );

  return result;
}

export function getAverageDtr(allDtrs: DepositTokenRatio[]): number {
  if (allDtrs.length === 0) {
    return 0;
  }
  if (allDtrs.length === 1) {
    return allDtrs[0].percent; // current value
  }
  let dtrsSum = 0;
  for (let i = 0; i < allDtrs.length - 1; i += 1) {
    dtrsSum +=
      ((allDtrs[i].percent + allDtrs[i + 1].percent) / 2) *
      (Number(allDtrs[i + 1].atTimestamp) - Number(allDtrs[i].atTimestamp));
  }
  return dtrsSum / (Number(allDtrs[allDtrs.length - 1].atTimestamp) - Number(allDtrs[0].atTimestamp));
}

// timeInterval in days
export async function getAverageDepositTokenRatios(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  timeIntervals: number[] = [1, 7, 30],
): Promise<AverageDepositTokenRatio[]> {
  let forTimeIntervals = timeIntervals;
  if (timeIntervals.length === 0) {
    forTimeIntervals = [0];
  }
  const maxTimeInterval = Math.max(...forTimeIntervals);
  const allDtrs = await getAllDtrsForTimeInterval(vaultAddress, jsonProvider, maxTimeInterval);
  const result = [] as AverageDepositTokenRatio[];
  forTimeIntervals.forEach((interval) => {
    const dtrsForTimeInterval =
      interval === 0
        ? [allDtrs[0]]
        : allDtrs.filter((elem) => Number(elem.atTimestamp) * 1000 >= Date.now() - daysToMilliseconds(interval));
    const averageDtr = getAverageDtr(dtrsForTimeInterval);
    result.push({ timePeriod: interval, percent: averageDtr });
  });
  return result;
}
