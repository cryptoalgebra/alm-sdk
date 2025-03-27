/* eslint-disable import/prefer-default-export */
import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import {
  DepositTokenRatio,
  Fees,
  SupportedChainId,
  SupportedDex,
  TotalAmounts,
  VaultMetrics,
  VaultTransactionEvent,
  ichiVaultDecimals,
} from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { getTokenDecimals } from './_totalBalances';
import { getCurrentDtr } from './priceFromPool';
import { daysToMilliseconds } from '../utils/timestamps';
import getPrice from '../utils/getPrice';
import {
  getAlgebraIntegralPoolContract,
  getAlgebraPoolContract,
  getIchiVaultContract,
  getUniswapV3PoolContract,
} from '../contracts';
import formatBigInt from '../utils/formatBigInt';
import { addressConfig } from '../utils/config/addresses';
import { getAverageDtr, getDtrAtFeeCollectionEvent, getDtrAtTransactionEvent } from './calculateDtr';
import { getTotalFeesAmountInBaseTokens } from './calculateFees';
import { getLpPriceAt } from './calculateApr';
import { _getDeposits, _getFeesCollectedEvents, _getRebalances, _getWithdraws } from './_vaultEvents';

export async function getVaultMetrics(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  timeIntervals?: number[],
): Promise<(VaultMetrics | null)[]> {
  const { chainId, vault } = await validateVaultData(vaultAddress, jsonProvider, dex);

  const decimals0 = await getTokenDecimals(vault.tokenA, jsonProvider, chainId);
  const decimals1 = await getTokenDecimals(vault.tokenB, jsonProvider, chainId);
  const isInv = vault.allowTokenB;
  const depositTokenDecimals = isInv ? decimals1 : decimals0;
  const scarceTokenDecimals = isInv ? decimals0 : decimals1;
  const vaultContract = getIchiVaultContract(vaultAddress, jsonProvider);

  // to remove/rewrite
  const arrDays = timeIntervals && timeIntervals.length > 0 ? timeIntervals : [1, 7, 30];
  const maxTimeInterval = Math.max(...arrDays);
  // const allDtrs = await getAllDtrsForTimeInterval(vaultAddress, jsonProvider, dex, maxTimeInterval);

  let currLpPrice = 0;
  let currTvl = 0;
  try {
    const totalAmountsBN = await vaultContract.getTotalAmounts();
    const totalAmounts = {
      total0: formatBigInt(totalAmountsBN.total0, decimals0),
      total1: formatBigInt(totalAmountsBN.total1, decimals1),
      0: formatBigInt(totalAmountsBN.total0, decimals0),
      1: formatBigInt(totalAmountsBN.total1, decimals1),
    } as TotalAmounts;

    let sqrtPrice: BigNumber;
    const poolAddress: string = await vaultContract.pool();

    if (addressConfig[chainId as SupportedChainId]![dex]?.isAlgebra) {
      if (addressConfig[chainId as SupportedChainId]![dex]?.ammVersion === 'algebraIntegral') {
        const poolContract = getAlgebraIntegralPoolContract(poolAddress, jsonProvider);
        const globalState = await poolContract.globalState();
        sqrtPrice = globalState.price;
      } else {
        const poolContract = getAlgebraPoolContract(poolAddress, jsonProvider);
        const globalState = await poolContract.globalState();
        sqrtPrice = globalState.price;
      }
    } else {
      const poolContract = getUniswapV3PoolContract(poolAddress, jsonProvider);
      const slot0 = await poolContract.slot0();
      sqrtPrice = slot0.sqrtPriceX96;
    }
    const price = getPrice(isInv, sqrtPrice, depositTokenDecimals, scarceTokenDecimals, 15);
    currTvl = !isInv
      ? Number(totalAmounts.total0) + Number(totalAmounts.total1) * price
      : Number(totalAmounts.total1) + Number(totalAmounts.total0) * price;

    const totalSupplyBN = await vaultContract.totalSupply();
    const totalSupply = formatBigInt(totalSupplyBN, ichiVaultDecimals);

    if (Number(totalSupply) === 0) {
      throw new Error(`Could not get LP price. Vault total supply is 0 for vault ${vaultAddress} on chain ${chainId}`);
    }

    currLpPrice = currTvl / Number(totalSupply);
  } catch (e) {
    console.error(`Could not get LP price from vault ${vaultAddress} `);
    throw e;
  }

  const rebalances = (await _getRebalances(vaultAddress, chainId, dex)) as Fees[];
  if (!rebalances) throw new Error(`Error getting vault rebalances on ${chainId} for ${vaultAddress}`);
  const collectedFees = (await _getFeesCollectedEvents(vaultAddress, chainId, dex)) as Fees[];
  if (!collectedFees) throw new Error(`Error getting vault collected fees on ${chainId} for ${vaultAddress}`);
  const deposits = (await _getDeposits(vaultAddress, chainId, dex)) as VaultTransactionEvent[];
  if (!deposits) throw new Error(`Error getting vault deposits on ${chainId} for ${vaultAddress}`);
  const withdraws = (await _getWithdraws(vaultAddress, chainId, dex)) as VaultTransactionEvent[];
  if (!withdraws) throw new Error(`Error getting vault withdraws on ${chainId} for ${vaultAddress}`);

  const vaultEvents = [...deposits, ...withdraws, ...rebalances, ...collectedFees].sort(
    (a, b) => Number(b.createdAtTimestamp) - Number(a.createdAtTimestamp), // recent events first
  );

  const arrRebalances = rebalances
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(maxTimeInterval))
    .map((e) => getDtrAtFeeCollectionEvent(e, isInv, decimals0, decimals1));
  const arrOtherFees = collectedFees
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(maxTimeInterval))
    .map((e) => getDtrAtFeeCollectionEvent(e, isInv, decimals0, decimals1));
  const arrDeposits = deposits
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(maxTimeInterval))
    .map((e) => getDtrAtTransactionEvent(e, isInv, decimals0, decimals1));
  const arrWithdraws = withdraws
    .slice()
    .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(maxTimeInterval))
    .map((e) => getDtrAtTransactionEvent(e, isInv, decimals0, decimals1));
  const currentDtr = {
    atTimestamp: Math.floor(Date.now() / 1000).toString(),
    percent: await getCurrentDtr(vaultAddress, jsonProvider, dex, isInv, decimals0, decimals1),
  } as DepositTokenRatio;

  const allDtrs = [...arrDeposits, ...arrWithdraws, ...arrRebalances, ...arrOtherFees, currentDtr].sort(
    (a, b) => Number(b.atTimestamp) - Number(a.atTimestamp), // recent events first, starting with current value
  );

  const result = [] as VaultMetrics[];

  arrDays.forEach((d) => {
    const objLpPrice = getLpPriceAt(vaultEvents, d, isInv, decimals0, decimals1);
    const prevLpPrice = objLpPrice?.priceChange;
    const priceChange = !prevLpPrice || prevLpPrice === 0 ? null : ((currLpPrice - prevLpPrice) / prevLpPrice) * 100;

    const lpApr = !prevLpPrice
      ? null
      : ((currLpPrice - prevLpPrice) / ((prevLpPrice * objLpPrice.timeInterval) / 365)) * 100;

    const dtrsForTimeInterval = allDtrs.filter(
      (elem) => Number(elem.atTimestamp) * 1000 >= Date.now() - daysToMilliseconds(d),
    );
    const averageDtr = getAverageDtr(dtrsForTimeInterval);

    const filteredRebalances = rebalances
      .slice()
      .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(d));
    const filteredFees = collectedFees
      .slice()
      .filter((r) => Number(r.createdAtTimestamp) * 1000 > Date.now() - daysToMilliseconds(d));
    const totalFeesAmount =
      getTotalFeesAmountInBaseTokens(filteredRebalances, decimals0, decimals1, isInv) +
      getTotalFeesAmountInBaseTokens(filteredFees, decimals0, decimals1, isInv);
    const feeApr = d !== 0 && currTvl !== 0 ? (((totalFeesAmount / d) * 365) / currTvl) * 100 : 0;

    result.push({
      timeInterval: d,
      lpPriceChange: priceChange,
      lpApr,
      avgDtr: averageDtr,
      feeApr,
    });
  });
  return result;
}
