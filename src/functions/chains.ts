// eslint-disable-next-line import/no-unresolved
import { SupportedDex, SupportedChainId } from '../types';
// eslint-disable-next-line import/no-cycle
import { addressConfig } from '../utils/config/addresses';

export function getSupportedDexes(chainId: SupportedChainId): SupportedDex[] {
  const chainConfig = addressConfig[chainId];

  if (!chainConfig) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  return Object.keys(chainConfig) as SupportedDex[];
}

export function getChainsForDex(dex: SupportedDex): SupportedChainId[] {
  const chainsWithDex: SupportedChainId[] = [];

  Object.keys(addressConfig).forEach((chainId) => {
    const chainConfig = addressConfig[Number(chainId) as SupportedChainId];

    // Check if the DEX exists in the current chain configuration
    if (chainConfig && dex in chainConfig) {
      chainsWithDex.push(Number(chainId) as SupportedChainId);
    }
  });
  return chainsWithDex;
}
