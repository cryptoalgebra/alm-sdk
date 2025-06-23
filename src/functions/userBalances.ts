/* eslint-disable no-redeclare */
/* eslint-disable import/prefer-default-export */

import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
// eslint-disable-next-line import/no-unresolved
import { request } from 'graphql-request';
import { formatUnits } from '@ethersproject/units';
import { getAlgebraVaultContract } from '../contracts';
import {
  SupportedDex,
  UserAmounts,
  UserAmountsBN,
  UserAmountsInVault,
  UserAmountsInVaultBN,
  UserBalanceInVault,
  UserBalanceInVaultBN,
  UserBalances,
  VaultShares,
  algebraVaultDecimals,
} from '../types';
import formatBigInt from '../utils/formatBigInt';
// eslint-disable-next-line import/no-cycle
import { getChainByProvider, validateVaultData } from './vault';
import { UserBalancesQueryData } from '../types/vaultQueryData';
import { userBalancesQuery } from '../graphql/queries';
import parseBigInt from '../utils/parseBigInt';
import getGraphUrls from '../utils/getGraphUrls';
import {
  decodeDecimalsResult,
  decodeTotalAmountsResult,
  decodeTotalSupplyResult,
  encodeDecimalsCall,
  encodeTotalAmountsCall,
  encodeTotalSupplyCall,
  multicall,
} from '../utils/multicallUtils';
import { _getTotalAmounts, _getTotalSupply } from './_totalBalances';

const promises: Record<string, Promise<any>> = {};

/**
 * Helper function to get token address regardless of naming convention (token0/1 or tokenA/B)
 * @param vault The vault object from API
 * @param index Token index (0 or 1)
 * @returns Token address
 */
function getTokenAddress(vault: any, index: number): string {
  if (index === 0) {
    return vault.token0 || vault.tokenA || '';
  } else {
    return vault.token1 || vault.tokenB || '';
  }
}

// eslint-disable-next-line no-underscore-dangle
async function _getUserBalance(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<string>;

// eslint-disable-next-line no-underscore-dangle
async function _getUserBalance(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw: true,
): Promise<BigNumber>;

// eslint-disable-next-line no-underscore-dangle
async function _getUserBalance(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  raw?: true,
) {
  const vaultContract = getAlgebraVaultContract(vaultAddress, jsonProvider);
  const shares = await vaultContract.balanceOf(accountAddress);

  return raw ? shares : formatBigInt(shares, algebraVaultDecimals);
}

export async function getUserBalance(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<string>;

export async function getUserBalance(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: true,
): Promise<BigNumber>;

export async function getUserBalance(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw?: true,
) {
  // eslint-disable-next-line no-return-await
  await validateVaultData(vaultAddress, jsonProvider, dex);

  return raw
    ? _getUserBalance(accountAddress, vaultAddress, jsonProvider, true)
    : _getUserBalance(accountAddress, vaultAddress, jsonProvider);
}

export async function sendUserBalancesQueryRequest(
  url: string,
  accountAddress: string,
  query: string,
): Promise<UserBalancesQueryData['vaultShares']> {
  return request<UserBalancesQueryData, { accountAddress: string }>(url, query, {
    accountAddress: accountAddress.toLowerCase(),
  }).then(({ vaultShares }) => vaultShares);
}
function storeResult(key: string, result: any) {
  const cacheTtl =
    process.env.CACHE_TTL && !Number.isNaN(process.env.CACHE_TTL) ? Number(process.env.CACHE_TTL) : 120000; // 120000 = 2min
  promises[key] = Promise.resolve(result);
  setTimeout(() => {
    delete promises[key];
  }, cacheTtl);
}

export async function getAllUserBalances(
  accountAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<UserBalanceInVault[]>;

export async function getAllUserBalances(
  accountAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: true,
): Promise<UserBalanceInVaultBN[]>;

export async function getAllUserBalances(
  accountAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw?: true,
) {
  const { chainId } = await getChainByProvider(jsonProvider);
  const { publishedUrl, url } = getGraphUrls(chainId, dex, true);

  let shares: UserBalanceInVault[];
  const key = `${chainId + accountAddress}-balances`;
  if (!Object.prototype.hasOwnProperty.call(promises, key)) {
    const strUserBalancesQuery = userBalancesQuery();
    try {
      if (publishedUrl) {
        const result = await sendUserBalancesQueryRequest(publishedUrl, accountAddress, strUserBalancesQuery);
        storeResult(key, result);
      } else {
        throw new Error(`Published URL is invalid for dex ${dex} on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        const result = await sendUserBalancesQueryRequest(url, accountAddress, strUserBalancesQuery);
        storeResult(key, result);
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get user balances for ${accountAddress} on chain ${chainId}`);
      }
    }
  }

  const balances = await promises[key];
  if (balances) {
    const userBalances = (balances as UserBalances).vaultShares;
    shares = userBalances.map((balance) => {
      return { vaultAddress: balance.vault.id, shares: balance.vaultShareBalance };
    });
    return raw
      ? shares.map((s) => {
          return { vaultAddress: s.vaultAddress, shares: parseBigInt(s.shares, algebraVaultDecimals) };
        })
      : shares;
  } else {
    return [];
  }
}

export async function getUserAmounts(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  token0Decimals: number,
  token1Decimals: number,
  raw: false,
): Promise<UserAmounts>;

export async function getUserAmounts(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  token0Decimals: number,
  token1Decimals: number,
  raw: true,
): Promise<UserAmountsBN>;

export async function getUserAmounts(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  token0Decimals: number,
  token1Decimals: number,
  raw: boolean,
) {
  const { vault } = await validateVaultData(vaultAddress, jsonProvider, dex);

  const [totalAmounts, totalSupply, shares] = await Promise.all([
    _getTotalAmounts(vault, jsonProvider, token0Decimals, token1Decimals, true),
    _getTotalSupply(vaultAddress, jsonProvider, true),
    _getUserBalance(accountAddress, vaultAddress, jsonProvider, true),
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

export async function getAllUserAmounts(
  accountAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<UserAmountsInVault[]>;

export async function getAllUserAmounts(
  accountAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw: true,
): Promise<UserAmountsInVaultBN[]>;

export async function getAllUserAmounts(
  accountAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  raw?: true,
) {
  const { chainId } = await getChainByProvider(jsonProvider);
  const { publishedUrl, url } = getGraphUrls(chainId, dex, true);

  const key = `${chainId + accountAddress}-all-user-amounts`;
  if (!Object.prototype.hasOwnProperty.call(promises, key)) {
    const strUserBalancesQuery = userBalancesQuery();
    try {
      if (publishedUrl) {
        const result = await sendUserBalancesQueryRequest(publishedUrl, accountAddress, strUserBalancesQuery);
        storeResult(key, result);
      } else {
        throw new Error(`Published URL is invalid for dex ${dex} on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        const result = await sendUserBalancesQueryRequest(url, accountAddress, strUserBalancesQuery);
        storeResult(key, result);
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get user balances for ${accountAddress} on chain ${chainId}`);
      }
    }
  }

  try {
    const balances = await promises[key];
    if (!balances?.vaultShares?.length) {
      return [];
    }

    // Prepare multicall calls
    const calls = balances.vaultShares.flatMap((share: VaultShares) => {
      // Normalize token naming by checking which properties exist
      const token0Address = getTokenAddress(share.vault, 0);
      const token1Address = getTokenAddress(share.vault, 1);

      return [
        encodeTotalAmountsCall(share.vault.id),
        encodeTotalSupplyCall(share.vault.id),
        encodeDecimalsCall(token0Address),
        encodeDecimalsCall(token1Address),
      ];
    });

    // Execute multicall
    const signer = jsonProvider.getSigner(accountAddress);
    const results = await multicall(calls, chainId, signer);

    // Process results
    const processedResults = balances.vaultShares.map((share: VaultShares, index: number) => {
      const baseIndex = index * 4;
      const totalAmounts = decodeTotalAmountsResult(results[baseIndex], share.vault.id);
      const totalSupply = decodeTotalSupplyResult(results[baseIndex + 1], share.vault.id);

      const token0Address = getTokenAddress(share.vault, 0);
      const token1Address = getTokenAddress(share.vault, 1);

      const token0Decimals = decodeDecimalsResult(results[baseIndex + 2], token0Address);
      const token1Decimals = decodeDecimalsResult(results[baseIndex + 3], token1Address);

      const userBalance = parseBigInt(share.vaultShareBalance, algebraVaultDecimals);

      if (!totalSupply.isZero()) {
        const amount0 = userBalance.mul(totalAmounts.total0).div(totalSupply);
        const amount1 = userBalance.mul(totalAmounts.total1).div(totalSupply);

        if (!raw) {
          const userAmounts = [formatBigInt(amount0, token0Decimals), formatBigInt(amount1, token1Decimals)];
          return { vaultAddress: share.vault.id, userAmounts };
        } else {
          const userAmountsBN = [amount0, amount1];
          return { vaultAddress: share.vault.id, userAmounts: userAmountsBN };
        }
      } else {
        return {
          poolAddress: share.vault.pool,
          vaultAddress: share.vault.id,
          userAmounts: !raw
            ? {
                amount0: '0',
                amount1: '0',
                0: '0',
                1: '0',
              }
            : [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)],
        } as UserAmountsInVault | UserAmountsInVaultBN;
      }
    });

    return processedResults;
  } catch (error) {
    console.error('Could not get user amounts');
    throw error;
  }
}
