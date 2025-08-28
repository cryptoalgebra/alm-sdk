import { SupportedChainId } from '../types';

export type SupportedDexConfig = {
  depositGuardAddress: string;
  vaultDeployerAddress: string;
};

const DEFAULT_VAULT_DEPLOYER = '0xDeaD1F5aF792afc125812E875A891b038f888258';

// externally
export const VAULT_DEPOSIT_GUARD: Record<SupportedChainId, string> = {
  [SupportedChainId.HyperEvmMainnet]: '0x9BdBB40E595Bd5a9D198209725fd1D26348ef67f',
};

export const FARMING_REWARDS_DISTRIBUTOR: Record<SupportedChainId, string> = {
  [SupportedChainId.HyperEvmMainnet]: '0x9BdBB40E595Bd5a9D198209725fd1D26348ef67f',
};

// internally
export const addressConfig: Record<SupportedChainId, SupportedDexConfig> = {
  [SupportedChainId.HyperEvmMainnet]: {
    depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.HyperEvmMainnet],
    vaultDeployerAddress: DEFAULT_VAULT_DEPLOYER,
  },
};

export const MULTICALL_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.HyperEvmMainnet]: '0x1094487796e6b8A24A587456Dbac00f13Fc00c8C',
};
