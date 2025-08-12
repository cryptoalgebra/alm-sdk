/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable radix */
/* eslint-disable import/no-cycle */
// eslint-disable-next-line import/no-unresolved
import { SupportedChainId, Fees, VaultTransactionEvent, VaultState } from '../types';
import {
  allEventsQuery,
  rebalancesQuery,
  vaultCollectFeesQuery,
  vaultDepositsQuery,
  vaultWithdrawsQuery,
} from '../graphql/queries';
import { daysToMilliseconds } from '../utils/timestamps';
import getGraphUrls from '../utils/getGraphUrls';
import cache from '../utils/cache';
import {
  sendAllEventsQueryRequest,
  sendCollectFeesQueryRequest,
  sendDepositsQueryRequest,
  sendRebalancesQueryRequest,
  sendWithdrawsQueryRequest,
} from '../graphql/functions';

// eslint-disable-next-line no-underscore-dangle
export async function _getAllEvents(
  vaultAddress: string,
  chainId: SupportedChainId,
  days?: number,
): Promise<VaultState[]> {
  const key = `allevents-${chainId}-${vaultAddress}-${days}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as Fees[];
  }

  const ttl = 120000;
  const { publishedUrl, url } = getGraphUrls(chainId, true);

  const currTimestamp = Date.now();
  const startTimestamp = days
    ? parseInt(((currTimestamp - daysToMilliseconds(days)) / 1000).toString()).toString()
    : '0';
  const query = allEventsQuery;

  const allEvents = [] as Fees[];
  let endOfData = false;
  let page = 0;
  while (!endOfData) {
    let result;
    try {
      if (publishedUrl) {
        result = await sendAllEventsQueryRequest(publishedUrl, vaultAddress, startTimestamp, query(page));
      } else {
        throw new Error(`Published URL is invalid on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        result = await sendAllEventsQueryRequest(url, vaultAddress, startTimestamp, query(page));
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get rebalances for vault ${vaultAddress} on chain ${chainId}`);
      }
    }
    if (result) {
      allEvents.push(...result.vaultRebalances);
      allEvents.push(...result.vaultCollectFees);
      allEvents.push(...result.vaultDeposits);
      allEvents.push(...result.vaultWithdraws);
      page += 1;
      if (
        result.vaultRebalances.length < 1000 &&
        result.vaultCollectFees?.length < 1000 &&
        result.vaultDeposits.length < 1000 &&
        result.vaultWithdraws.length < 1000
      ) {
        endOfData = true;
      }
    } else {
      endOfData = true;
    }
  }
  cache.set(key, allEvents, ttl);

  return allEvents;
}

// eslint-disable-next-line no-underscore-dangle
export async function _getRebalances(vaultAddress: string, chainId: SupportedChainId, days?: number): Promise<Fees[]> {
  const key = `rebalances-${chainId}-${vaultAddress}-${days}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as Fees[];
  }

  const ttl = 120000;
  const { publishedUrl, url } = getGraphUrls(chainId, true);

  const currTimestamp = Date.now();
  const startTimestamp = days
    ? parseInt(((currTimestamp - daysToMilliseconds(days)) / 1000).toString()).toString()
    : '0';

  const rebalances = [] as Fees[];
  let endOfData = false;
  let page = 0;
  while (!endOfData) {
    let result;
    try {
      if (publishedUrl) {
        result = await sendRebalancesQueryRequest(publishedUrl, vaultAddress, startTimestamp, rebalancesQuery(page));
      } else {
        throw new Error(`Published URL is invalid on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        result = await sendRebalancesQueryRequest(url, vaultAddress, startTimestamp, rebalancesQuery(page));
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get rebalances for vault ${vaultAddress} on chain ${chainId}`);
      }
    }
    if (result) {
      rebalances.push(...result);
      page += 1;
      if (result.length < 1000) {
        endOfData = true;
      }
    } else {
      endOfData = true;
    }
  }
  cache.set(key, rebalances, ttl);

  return rebalances;
}

// eslint-disable-next-line no-underscore-dangle
export async function _getFeesCollectedEvents(
  vaultAddress: string,
  chainId: SupportedChainId,
  days?: number,
): Promise<Fees[]> {
  const key = `fees-${chainId}-${vaultAddress}-${days}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as Fees[];
  }

  const ttl = 120000;
  const { publishedUrl, url } = getGraphUrls(chainId, true);

  const currTimestamp = Date.now();
  const startTimestamp = days
    ? parseInt(((currTimestamp - daysToMilliseconds(days)) / 1000).toString()).toString()
    : '0';

  const otherFees = [] as Fees[];
  let endOfData = false;
  let page = 0;
  while (!endOfData) {
    let result;
    try {
      if (publishedUrl) {
        result = await sendCollectFeesQueryRequest(
          publishedUrl,
          vaultAddress,
          startTimestamp,
          vaultCollectFeesQuery(page),
        );
      } else {
        throw new Error(`Published URL is invalid on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        result = await sendCollectFeesQueryRequest(url, vaultAddress, startTimestamp, vaultCollectFeesQuery(page));
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get collected fees for vault ${vaultAddress} on chain ${chainId}`);
      }
    }
    if (result) {
      otherFees.push(...result);
      page += 1;
      if (result.length < 1000) {
        endOfData = true;
      }
    } else {
      endOfData = true;
    }
  }
  cache.set(key, otherFees, ttl);

  return otherFees;
}

// eslint-disable-next-line no-underscore-dangle
export async function _getDeposits(
  vaultAddress: string,
  chainId: SupportedChainId,
  days?: number,
): Promise<VaultTransactionEvent[]> {
  const key = `deposits-${chainId}-${vaultAddress}-${days}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as VaultTransactionEvent[];
  }

  const ttl = 120000;
  const { publishedUrl, url } = getGraphUrls(chainId, true);

  const currTimestamp = Date.now();
  const startTimestamp = days
    ? parseInt(((currTimestamp - daysToMilliseconds(days)) / 1000).toString()).toString()
    : '0';

  const depositEvents = [] as VaultTransactionEvent[];
  let endOfData = false;
  let page = 0;
  while (!endOfData) {
    let result;
    try {
      if (publishedUrl) {
        result = await sendDepositsQueryRequest(publishedUrl, vaultAddress, vaultDepositsQuery(page), startTimestamp);
      } else {
        throw new Error(`Published URL is invalid on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        result = await sendDepositsQueryRequest(url, vaultAddress, vaultDepositsQuery(page), startTimestamp);
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get deposits for vault ${vaultAddress} on chain ${chainId}`);
      }
    }
    if (result) {
      depositEvents.push(...result);
      page += 1;
      if (result.length < 1000) {
        endOfData = true;
      }
    } else {
      endOfData = true;
    }
  }
  cache.set(key, depositEvents, ttl);

  return depositEvents;
}

// eslint-disable-next-line no-underscore-dangle
export async function _getWithdraws(
  vaultAddress: string,
  chainId: SupportedChainId,
  days?: number,
): Promise<VaultTransactionEvent[]> {
  const key = `withdraws-${chainId}-${vaultAddress}-${days}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as VaultTransactionEvent[];
  }

  const ttl = 120000;
  const { publishedUrl, url } = getGraphUrls(chainId, true);

  const currTimestamp = Date.now();
  const startTimestamp = days
    ? parseInt(((currTimestamp - daysToMilliseconds(days)) / 1000).toString()).toString()
    : '0';

  const withdrawEvents = [] as VaultTransactionEvent[];
  let endOfData = false;
  let page = 0;
  while (!endOfData) {
    let result;
    try {
      if (publishedUrl) {
        result = await sendWithdrawsQueryRequest(publishedUrl, vaultAddress, vaultWithdrawsQuery(page), startTimestamp);
      } else {
        throw new Error(`Published URL is invalid on chain ${chainId}`);
      }
    } catch (error) {
      if (publishedUrl) {
        console.error('Request to published graph URL failed:', error);
      }
      try {
        result = await sendWithdrawsQueryRequest(url, vaultAddress, vaultWithdrawsQuery(page), startTimestamp);
      } catch (error2) {
        console.error('Request to public graph URL failed:', error2);
        throw new Error(`Could not get withdraws for vault ${vaultAddress} on chain ${chainId}`);
      }
    }
    if (result) {
      withdrawEvents.push(...result);
      page += 1;
      if (result.length < 1000) {
        endOfData = true;
      }
    } else {
      endOfData = true;
    }
  }
  cache.set(key, withdrawEvents, ttl);

  return withdrawEvents;
}

// eslint-disable-next-line no-underscore-dangle
export async function _getAllVaultEvents(
  vaultAddress: string,
  chainId: SupportedChainId,
  days?: number,
): Promise<VaultState[]> {
  const key = `allEvents-${chainId}-${vaultAddress}`;
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData as VaultState[];
  }

  const ttl = 120000;
  const allEvents = await _getAllEvents(vaultAddress, chainId, days);
  const result = allEvents.sort(
    (a, b) => Number(b.createdAtTimestamp) - Number(a.createdAtTimestamp), // recent events first
  );
  cache.set(key, result, ttl);

  return result;
}

export function getVaultStateAt(vaultEvents: VaultState[], daysAgo: number): VaultState | null {
  if (vaultEvents.length === 0) {
    return null;
  }
  const eventsBefore = vaultEvents.filter(
    (e) => Number(e.createdAtTimestamp) * 1000 <= Date.now() - daysToMilliseconds(daysAgo),
  );
  if (eventsBefore.length > 0) {
    return eventsBefore[0];
  } else {
    return null;
  }
}
