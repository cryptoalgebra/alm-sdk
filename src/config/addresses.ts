import { SupportedChainId } from '../types';

export type SupportedDexConfig = {
  depositGuardAddress: string;
  vaultDeployerAddress: string;
};

// externally
export const VAULT_DEPOSIT_GUARD: Record<SupportedChainId, string> = {
  [SupportedChainId.Base]: '0x1e18b4a180b13520bD202e571cD9dFE0A545Cc85', // clamm
  [SupportedChainId.BaseSepolia]: '0x9E74bE17D1CeeBf1FE2856A99d6774e80bF34ec9', // integral farming + alm
};

// internally
export const addressConfig: Record<SupportedChainId, SupportedDexConfig> = {
  [SupportedChainId.Base]: {
    depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.Base],
    vaultDeployerAddress: '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e',
  },
  [SupportedChainId.BaseSepolia]: {
    depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.BaseSepolia],
    vaultDeployerAddress: '0xDeaD1F5aF792afc125812E875A891b038f888258',
  },
};

export const MULTICALL_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.Base]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
  [SupportedChainId.BaseSepolia]: '0xf08e7861984cb4d2ba8b69e3c4ae20443dfa3c31',
};
