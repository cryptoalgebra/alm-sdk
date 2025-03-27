/* eslint-disable camelcase */
/* eslint-disable import/no-cycle */
// eslint-disable-next-line import/no-unresolved
import { request } from 'graphql-request';
import {
  CollectFeesQueryData,
  FeeAprQueryResponse,
  RebalancesQueryData,
  VaultDepositsQueryData,
  VaultWithdrawsQueryData,
} from '../types/vaultQueryData';
import { feeAprQuery } from './queries';

export async function sendAllEventsQueryRequest(
  url: string,
  vaultAddress: string,
  createdAtTimestamp_gt: string,
  query: string,
): Promise<any> {
  return request<any, { vaultAddress: string; createdAtTimestamp_gt: string }>(url, query, {
    vaultAddress,
    createdAtTimestamp_gt,
  }).then((result) => result);
}

export async function sendRebalancesQueryRequest(
  url: string,
  vaultAddress: string,
  createdAtTimestamp_gt: string,
  query: string,
): Promise<RebalancesQueryData['vaultRebalances']> {
  return request<RebalancesQueryData, { vaultAddress: string; createdAtTimestamp_gt: string }>(url, query, {
    vaultAddress,
    createdAtTimestamp_gt,
  }).then(({ vaultRebalances }) => vaultRebalances);
}

export async function sendCollectFeesQueryRequest(
  url: string,
  vaultAddress: string,
  createdAtTimestamp_gt: string,
  query: string,
): Promise<CollectFeesQueryData['vaultCollectFees']> {
  return request<CollectFeesQueryData, { vaultAddress: string; createdAtTimestamp_gt: string }>(url, query, {
    vaultAddress,
    createdAtTimestamp_gt,
  }).then(({ vaultCollectFees }) => vaultCollectFees);
}

export async function sendDepositsQueryRequest(
  url: string,
  vaultAddress: string,
  createdAtTimestamp_gt: string,
  query: string,
): Promise<VaultDepositsQueryData['vaultDeposits']> {
  return request<VaultDepositsQueryData, { vaultAddress: string; createdAtTimestamp_gt: string }>(url, query, {
    vaultAddress,
    createdAtTimestamp_gt,
  }).then(({ vaultDeposits }) => vaultDeposits);
}

export async function sendWithdrawsQueryRequest(
  url: string,
  vaultAddress: string,
  createdAtTimestamp_gt: string,
  query: string,
): Promise<VaultWithdrawsQueryData['vaultWithdraws']> {
  return request<VaultWithdrawsQueryData, { vaultAddress: string; createdAtTimestamp_gt: string }>(url, query, {
    vaultAddress,
    createdAtTimestamp_gt,
  }).then(({ vaultWithdraws }) => vaultWithdraws);
}

export async function sendFeeAprQueryRequest(url: string, vaultAddress: string): Promise<FeeAprQueryResponse> {
  return request<FeeAprQueryResponse, { vaultAddress: string }>(url, feeAprQuery, {
    vaultAddress: vaultAddress.toLowerCase(),
  });
}
