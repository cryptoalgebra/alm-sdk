import { SupportedDex, SupportedChainId } from '../types';
import vaultAddresses from './vaults.json';

export type AddressConfig = { [key in SupportedDex]?: string };

export type SupportedDexConfig = {
  depositGuardAddress: string;
  vaultDeployerAddress: string;
  vaults: Record<string, string[]>; // pool -> vaults
};

export type Config = { [key in SupportedDex]?: SupportedDexConfig };

export const addressConfig: Record<SupportedChainId, Config> = {
  [SupportedChainId.Base]: {
    [SupportedDex.CLAMM]: {
      depositGuardAddress: '0xBe23De183F33a4263F8b3bC0F842C2Ec5BE06e9e',
      vaultDeployerAddress: '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e',
      vaults: vaultAddresses.Base.CLAMM,
    },
  },
  [SupportedChainId.BaseSepolia]: {
    [SupportedDex.CLAMM]: {
      depositGuardAddress: '0x6768D9cEC5e1C4f416685dBfCFa4F92E660dc129',
      vaultDeployerAddress: '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e',
      vaults: vaultAddresses.BaseSepolia.CLAMM,
    },
  },
};

export const MULTICALL_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.Base]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
  [SupportedChainId.BaseSepolia]: '0xf08e7861984cb4d2ba8b69e3c4ae20443dfa3c31',
};
