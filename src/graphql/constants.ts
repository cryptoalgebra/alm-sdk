/* eslint-disable import/prefer-default-export */
import { SupportedChainId } from '../types';

type GraphQL = {
  url: string;
  publishedUrl: string;
};

// 'none' indicates that graph is not enabled on that chain
export const graphUrls: Record<SupportedChainId, GraphQL> = {
  [SupportedChainId.HyperEvmMainnet]: {
    url: 'https://api.goldsky.com/api/public/project_cmay1j7dh90w601r2hjv26a5b/subgraphs/algebra-alm/v1.0.0/gn',
    publishedUrl: 'https://api.goldsky.com/api/public/project_cmay1j7dh90w601r2hjv26a5b/subgraphs/algebra-alm/v1.0.0/gn',
  },
};
