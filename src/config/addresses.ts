import { SupportedDex, SupportedChainId } from '../types';

export type AddressConfig = { [key in SupportedDex]?: string };

export type SupportedDexConfig = {
  depositGuardAddress: string;
  vaultDeployerAddress: string;
};

export type Config = { [key in SupportedDex]?: SupportedDexConfig };

const DEFAULT_VAULT_DEPLOYER = '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e';

// externally
export const VAULT_DEPOSIT_GUARD: Record<SupportedChainId, { [key in SupportedDex]: string }> = {
  [SupportedChainId.Base]: {
    [SupportedDex.CLAMM]: '0x1e18b4a180b13520bD202e571cD9dFE0A545Cc85',
  },
  [SupportedChainId.BaseSepolia]: {
    [SupportedDex.CLAMM]: '0x6768D9cEC5e1C4f416685dBfCFa4F92E660dc129',
  },
};

// internally
export const addressConfig: Record<SupportedChainId, Config> = {
  [SupportedChainId.Base]: {
    [SupportedDex.CLAMM]: {
      depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.Base][SupportedDex.CLAMM],
      vaultDeployerAddress: DEFAULT_VAULT_DEPLOYER,
    },
  },
  [SupportedChainId.BaseSepolia]: {
    [SupportedDex.CLAMM]: {
      depositGuardAddress: VAULT_DEPOSIT_GUARD[SupportedChainId.BaseSepolia][SupportedDex.CLAMM],
      vaultDeployerAddress: DEFAULT_VAULT_DEPLOYER,
    },
  },
};

export const MULTICALL_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.Base]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
  [SupportedChainId.BaseSepolia]: '0xf08e7861984cb4d2ba8b69e3c4ae20443dfa3c31',
};
