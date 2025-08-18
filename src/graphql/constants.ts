/* eslint-disable import/prefer-default-export */
import { SupportedChainId } from '../types';

type GraphQL = {
  url: string;
  publishedUrl: string;
};

// 'none' indicates that graph is not enabled on that chain
export const graphUrls: Record<SupportedChainId, GraphQL> = {
  [SupportedChainId.Base]: {
    url: 'https://api.studio.thegraph.com/query/50593/clamm-alm/version/latest',
    publishedUrl: 'https://api.studio.thegraph.com/query/50593/clamm-alm/version/latest',
  },
  [SupportedChainId.BaseSepolia]: {
    url: 'https://api.studio.thegraph.com/query/50593/base-sepolia-alm/v0.0.6',
    publishedUrl: 'https://api.studio.thegraph.com/query/50593/base-sepolia-alm/v0.0.6',
  },
};
