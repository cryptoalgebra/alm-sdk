import { SupportedChainId } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const ALM_GRAPH_URL: Record<SupportedChainId, string | 'none'> = {
  [SupportedChainId.Base]: 'https://api.studio.thegraph.com/query/50593/clamm-alm/version/latest', // clamm 1.2.1
  [SupportedChainId.BaseSepolia]: 'https://api.studio.thegraph.com/query/82608/ve-alm/version/latest', // integral 1.2.2 farming + alm + ve33
};
