/* eslint-disable import/prefer-default-export */
import { SupportedDex, SupportedChainId } from '../types';

type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};
type GraphQL = {
  url: string;
  publishedUrl: string;
};
type dexGraph = PartialRecord<SupportedDex, GraphQL>;

// 'none' indicates that graph is not enabled on that chain
export const graphUrls: Record<SupportedChainId, dexGraph> = {
  [SupportedChainId.Base]: {
    [SupportedDex.CLAMM]: {
      url: 'https://api.studio.thegraph.com/query/50593/clamm-alm/version/latest',
      publishedUrl: 'https://api.studio.thegraph.com/query/50593/clamm-alm/version/latest',
    },
  },
  [SupportedChainId.BaseSepolia]: {
    [SupportedDex.CLAMM]: {
      url: 'https://api.studio.thegraph.com/query/50593/base-testnet-alm/version/latest',
      publishedUrl: 'https://api.studio.thegraph.com/query/50593/base-testnet-alm/version/latest',
    },
  },
};
