import { SupportedChainId } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const ALM_GRAPH_URL: Record<SupportedChainId, string | 'none'> = {
  [SupportedChainId.Base]: 'https://api.studio.thegraph.com/query/50593/clamm-alm/version/latest', // clamm 1.2.1
  [SupportedChainId.BaseSepolia]:
    'https://gateway.thegraph.com/api/4d7b59e4fd14365ae609945af85f3938/subgraphs/id/6SC4NNXjdGP3mFtgC1S2zrVZ9DC73z1yVwcQCzFePTim', // integral 1.2.2 farming + alm + ve33
};
