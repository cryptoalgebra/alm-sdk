// eslint-disable-next-line import/no-cycle
import { sendDepositsQueryRequest, sendWithdrawsQueryRequest } from '../graphql/functions';
import { vaultDepositsQuery, vaultWithdrawsQuery } from '../graphql/queries';
import { SupportedDex, SupportedChainId } from '../types';
import getGraphUrls from '../utils/getGraphUrls';

export async function getUserDeposits(
  accountAddress: string,
  vaultAddress: string,
  dex: SupportedDex,
  chainId: SupportedChainId,
) {
  const { publishedUrl } = getGraphUrls(chainId, dex, true);

  try {
    if (publishedUrl) {
      const deposits = await sendDepositsQueryRequest(
        publishedUrl,
        vaultAddress,
        vaultDepositsQuery(0, undefined, accountAddress),
        undefined,
        accountAddress,
      );

      return deposits;
    } else {
      throw new Error(`Published URL is invalid for dex ${dex} on chain ${chainId}`);
    }
  } catch (error) {
    throw new Error(`Request to published graph URL failed: ${error}`);
  }
}

export async function getUserWithdraws(
  accountAddress: string,
  vaultAddress: string,
  dex: SupportedDex,
  chainId: SupportedChainId,
) {
  const { publishedUrl } = getGraphUrls(chainId, dex, true);

  try {
    if (publishedUrl) {
      const withdraws = await sendWithdrawsQueryRequest(
        publishedUrl,
        vaultAddress,
        vaultWithdrawsQuery(0, undefined, accountAddress),
        undefined,
        accountAddress,
      );

      return withdraws;
    } else {
      throw new Error(`Published URL is invalid for dex ${dex} on chain ${chainId}`);
    }
  } catch (error) {
    throw new Error(`Request to published graph URL failed: ${error}`);
  }
}
