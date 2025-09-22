// eslint-disable-next-line import/no-cycle
import { sendDepositsQueryRequest, sendWithdrawsQueryRequest } from '../graphql/functions';
import { vaultDepositsQuery, vaultWithdrawsQuery } from '../graphql/queries';
import { SupportedChainId } from '../types';
import getGraphUrls from '../utils/getGraphUrls';

export async function getUserDeposits(accountAddress: string, vaultAddress: string, chainId: SupportedChainId) {
  const { url } = getGraphUrls(chainId, true);

  try {
    if (url) {
      const deposits = await sendDepositsQueryRequest(
        url,
        vaultAddress,
        vaultDepositsQuery(0, undefined, accountAddress),
        undefined,
        accountAddress,
      );

      return deposits;
    } else {
      throw new Error(`Published URL is invalid on chain ${chainId}`);
    }
  } catch (error) {
    throw new Error(`Request to published graph URL failed: ${error}`);
  }
}

export async function getUserWithdraws(accountAddress: string, vaultAddress: string, chainId: SupportedChainId) {
  const { url } = getGraphUrls(chainId, true);

  try {
    if (url) {
      const withdraws = await sendWithdrawsQueryRequest(
        url,
        vaultAddress,
        vaultWithdrawsQuery(0, undefined, accountAddress),
        undefined,
        accountAddress,
      );

      return withdraws;
    } else {
      throw new Error(`Published URL is invalid on chain ${chainId}`);
    }
  } catch (error) {
    throw new Error(`Request to published graph URL failed: ${error}`);
  }
}
