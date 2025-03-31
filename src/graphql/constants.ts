/* eslint-disable import/prefer-default-export */
import { SupportedDex, SupportedChainId } from '../types';

type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};
type GraphQL = {
  url: string;
  publishedUrl: string;
  supportsCollectFees: boolean;
  version?: number; // version 2 uses token0/1 instead of tokenA/B, supports vault fee APRs
};
type dexGraph = PartialRecord<SupportedDex, GraphQL>;

// 'none' indicates that graph is not enabled on that chain
export const graphUrls: Record<SupportedChainId, dexGraph> = {
  [SupportedChainId.Base]: {
    [SupportedDex.CLAMM]: {
      url: 'none',
      publishedUrl: '',
      supportsCollectFees: true,
    },
  },
  [SupportedChainId.BaseSepolia]: {
    [SupportedDex.CLAMM]: {
      url: 'none',
      publishedUrl: '',
      supportsCollectFees: true,
    },
  },
};
