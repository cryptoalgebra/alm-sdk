import { SupportedChainId } from '../types';

export type SupportedDexConfig = {
  depositGuardAddress: string;
  vaultDeployerAddress: string;
};

const DEFAULT_VAULT_DEPLOYER = '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e';

// externally
export const VAULT_DEPOSIT_GUARD: Record<SupportedChainId, string> = {
  [SupportedChainId.Base]: '0x1e18b4a180b13520bD202e571cD9dFE0A545Cc85',
  [SupportedChainId.BaseSepolia]: '0x6768D9cEC5e1C4f416685dBfCFa4F92E660dc129',
};

export const FARMING_REWARDS_DISTRIBUTOR: Record<SupportedChainId, string> = {
  [SupportedChainId.Base]: '0x1e18b4a180b13520bD202e571cD9dFE0A545Cc85',
  [SupportedChainId.BaseSepolia]: '0x6768D9cEC5e1C4f416685dBfCFa4F92E660dc129',
};

// internally
export const addressConfig: Record<SupportedChainId, SupportedDexConfig> = {
  [SupportedChainId.Base]: {
    depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.Base],
    vaultDeployerAddress: DEFAULT_VAULT_DEPLOYER,
  },
  [SupportedChainId.BaseSepolia]: {
    depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.BaseSepolia],
    vaultDeployerAddress: DEFAULT_VAULT_DEPLOYER,
  },
};

export const MULTICALL_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.Base]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
  [SupportedChainId.BaseSepolia]: '0xf08e7861984cb4d2ba8b69e3c4ae20443dfa3c31',
};
