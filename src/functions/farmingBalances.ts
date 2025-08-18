/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */

import { BigNumber } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { getFarmingRewardsDistributorContract } from '../contracts';
import formatBigInt from '../utils/formatBigInt';
import { algebraVaultDecimals, UserAmounts, UserAmountsBN } from '../types';
import { _getTotalAmounts, _getTotalSupply } from './_totalBalances';
import { getFarmingRewardsDistributorAddress } from '../utils/getFarmingRewardsDistributorAddress';

// eslint-disable-next-line no-underscore-dangle
async function _getUserBalanceStaked(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<string>;

// eslint-disable-next-line no-underscore-dangle
async function _getUserBalanceStaked(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: true,
): Promise<BigNumber>;

// eslint-disable-next-line no-underscore-dangle
async function _getUserBalanceStaked(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw?: true,
) {
  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, jsonProvider);

  const { tokenAmount } = await farmingDistributorContract.getUserData(accountAddress);

  return raw ? tokenAmount : formatBigInt(tokenAmount, algebraVaultDecimals);
}

export async function getUserAmountsStaked(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  token0Decimals: number,
  token1Decimals: number,
  raw: false,
): Promise<UserAmounts>;

export async function getUserAmountsStaked(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  token0Decimals: number,
  token1Decimals: number,
  raw: true,
): Promise<UserAmountsBN>;

export async function getUserAmountsStaked(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  token0Decimals: number,
  token1Decimals: number,
  raw: boolean,
) {
  const [shares, totalAmounts, totalSupply] = await Promise.all([
    _getUserBalanceStaked(accountAddress, vaultAddress, jsonProvider, true),
    _getTotalAmounts(vaultAddress, jsonProvider, token0Decimals, token1Decimals, true),
    _getTotalSupply(vaultAddress, jsonProvider, true),
  ]);

  const userAmountsBN: UserAmountsBN = [
    shares.mul(totalAmounts[0]).div(totalSupply),
    shares.mul(totalAmounts[1]).div(totalSupply),
    shares,
  ];

  const formattedUserAmounts: UserAmounts = [
    formatUnits(userAmountsBN[0], token0Decimals),
    formatUnits(userAmountsBN[1], token1Decimals),
    formatUnits(shares, algebraVaultDecimals),
  ];

  if (raw) {
    return userAmountsBN as UserAmountsBN;
  } else {
    return formattedUserAmounts as UserAmounts;
  }
}

// eslint-disable-next-line no-underscore-dangle
export async function getUserFarmingRewards(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
) {
  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, jsonProvider);

  const [[rewardTokenAddresses], rewardTokenAmounts] = await Promise.all([
    farmingDistributorContract.claimableRewards(accountAddress),
    farmingDistributorContract.callStatic.getAllRewards({ from: accountAddress }),
  ]);

  const rewardsMapping = new Map<string, BigNumber>();

  for (let i = 0; i < rewardTokenAddresses.length; i += 1) {
    rewardsMapping.set(rewardTokenAddresses[i].toLowerCase(), rewardTokenAmounts[i]);
  }

  return rewardsMapping;
}
