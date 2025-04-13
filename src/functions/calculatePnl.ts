import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import { SupportedDex } from '../types';
import cache from '../utils/cache';
import formatBigInt from '../utils/formatBigInt';
// eslint-disable-next-line import/no-cycle
import { getAmountsInDepositToken } from './calculateDtr';
import { getSqrtPriceFromPool } from './priceFromPool';
import { getChainByProvider, validateVaultData } from './vault';
import { getUserDeposits, getUserWithdraws } from './vaultEvents';

interface UserPnl {
  totalDepositAmountBN: BigNumber;
  totalWithdrawAmountBN: BigNumber;
  pnlBN: BigNumber;
  pnl: string;
  roi: number;
}

/** calculates the PNL/ROI of a user in price of the deposit token */
// eslint-disable-next-line import/prefer-default-export
export async function calculateUserDepositTokenPNL(
  accountAddress: string,
  vaultAddress: string,
  currentAmount0: string,
  currentAmount1: string,
  decimals0: number,
  decimals1: number,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<UserPnl> {
  const { chainId } = await getChainByProvider(jsonProvider);

  const key = `userDepositTokenPNL-${chainId}-${accountAddress}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as UserPnl;
  }

  const ttl = 3600000;

  const { vault } = await validateVaultData(vaultAddress, jsonProvider, dex);
  try {
    const deposits = await getUserDeposits(accountAddress, vaultAddress, dex, chainId);

    const withdraws = await getUserWithdraws(accountAddress, vaultAddress, dex, chainId);

    const totalDepositAmountBN = deposits.reduce((acc, deposit) => {
      const amount = getAmountsInDepositToken(
        BigNumber.from(deposit.sqrtPrice),
        BigNumber.from(deposit.amount0),
        BigNumber.from(deposit.amount1),
        decimals0,
        decimals1,
        vault.allowTokenA ? 0 : 1,
      );
      return acc.add(amount);
    }, BigNumber.from(0));

    const totalWithdrawAmountBN = withdraws.reduce((acc, withdraw) => {
      const amount = getAmountsInDepositToken(
        BigNumber.from(withdraw.sqrtPrice),
        BigNumber.from(withdraw.amount0),
        BigNumber.from(withdraw.amount1),
        decimals0,
        decimals1,
        vault.allowTokenA ? 0 : 1,
      );
      return acc.add(amount);
    }, BigNumber.from(0));

    const currentSqrtPrice = await getSqrtPriceFromPool(vault, jsonProvider);
    const currentAmount = getAmountsInDepositToken(
      currentSqrtPrice,
      BigNumber.from(currentAmount0),
      BigNumber.from(currentAmount1),
      decimals0,
      decimals1,
      vault.allowTokenA ? 0 : 1,
    );

    const pnlBN = totalWithdrawAmountBN.add(currentAmount).sub(totalDepositAmountBN);

    const pnl = formatBigInt(pnlBN, vault.allowTokenA ? decimals0 : decimals1);
    const roi =
      (Number(pnl) / Number(formatBigInt(totalDepositAmountBN, vault.allowTokenA ? decimals0 : decimals1))) * 100;

    const result = {
      totalDepositAmountBN,
      totalWithdrawAmountBN,
      pnlBN,
      pnl,
      roi,
    };
    cache.set(key, result, ttl);
    return result;
  } catch (error) {
    throw new Error(`Request to published graph URL failed: ${error}`);
  }
}
