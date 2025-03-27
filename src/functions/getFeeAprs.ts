/* eslint-disable import/prefer-default-export */
import { JsonRpcProvider } from '@ethersproject/providers';
import { FeeAprData, SupportedDex } from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { graphUrls } from '../graphql/constants';
import getGraphUrls from '../utils/getGraphUrls';
import cache from '../utils/cache';
import { FeeAprQueryResponse } from '../types/vaultQueryData';
import { sendFeeAprQueryRequest } from '../graphql/functions';

/**
 * Get fee APR values for a vault from a V2 subgraph
 * @param vaultAddress The address of the vault
 * @param jsonProvider A JsonRpcProvider
 * @param dex The DEX identifier
 * @returns Fee APR data for different time periods or null if data not available
 */
export async function getFeeAprs(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
): Promise<FeeAprData | null> {
  const key = `feeAprs-${dex}-${vaultAddress}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as FeeAprData;
  }

  // Cache for 30 minutes
  const ttl = 30 * 60 * 1000;

  const { chainId } = await validateVaultData(vaultAddress, jsonProvider, dex);

  // Check if the subgraph is version 2
  const dexConfig = graphUrls[chainId]?.[dex];
  if (!dexConfig || dexConfig.version !== 2) {
    console.error(`This function is not supported on chain ${chainId} and dex ${dex}:`);
    return null;
  }

  const { publishedUrl, url } = getGraphUrls(chainId, dex, true);

  try {
    let result: FeeAprQueryResponse | null = null;

    if (publishedUrl) {
      try {
        result = await sendFeeAprQueryRequest(publishedUrl, vaultAddress);
      } catch (error) {
        console.error('Request to published graph URL failed:', error);
      }
    }

    if (!result) {
      try {
        result = await sendFeeAprQueryRequest(url, vaultAddress);
      } catch (error) {
        console.error('Request to public graph URL failed:', error);
        return null;
      }
    }

    if (!result?.ichiVault) {
      return null;
    }

    const feeAprData: FeeAprData = {
      feeApr_1d: result.ichiVault.feeApr_1d ? result.ichiVault.feeApr_1d : null,
      feeApr_3d: result.ichiVault.feeApr_3d ? result.ichiVault.feeApr_3d : null,
      feeApr_7d: result.ichiVault.feeApr_7d ? result.ichiVault.feeApr_7d : null,
      feeApr_30d: result.ichiVault.feeApr_30d ? result.ichiVault.feeApr_30d : null,
    };

    cache.set(key, feeAprData, ttl);
    return feeAprData;
  } catch (error) {
    console.error(`Could not get fee APRs for vault ${vaultAddress} on chain ${chainId} and dex ${dex}:`, error);
    return null;
  }
}
