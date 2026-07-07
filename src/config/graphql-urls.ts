import { SupportedChainId } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const ALM_GRAPH_URL: Record<SupportedChainId, string | 'none'> = {
  [SupportedChainId.Base]:
    'https://gateway.thegraph.com/api/4d7b59e4fd14365ae609945af85f3938/subgraphs/id/JBPEDHbBjmDWNM1atSS6UkWPQi5HonjDU3c923vRTLqC', // clamm 1.2.1
  [SupportedChainId.BaseSepolia]: 'https://api.studio.thegraph.com/query/50593/base-testnet-alm/v0.0.7', // integral 1.2.2 farming + alm + ve33
};
