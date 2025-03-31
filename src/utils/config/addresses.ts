import { SupportedDex, SupportedChainId } from '../../types';

export type AddressConfig = { [key in SupportedDex]?: string };

export type SupportedDexConfig = {
  factoryAddress: string;
  depositGuard: {
    address: string;
    version: number;
  };
  vaultDeployerAddress: string;
  isAlgebra: boolean;
  ammVersion?: string;
  vaults: Record<string, string[]>; // pool -> vaults
  is2Thick?: boolean; // Equalizer 2Thick deployment, vaults don't have fee
};

export type Config = { [key in SupportedDex]?: SupportedDexConfig };

export const addressConfig: Record<SupportedChainId, Config> = {
  [SupportedChainId.Base]: {},
  [SupportedChainId.BaseSepolia]: {
    [SupportedDex.CLAMM]: {
      factoryAddress: '0x44a48691113c6Ffda540C3Cb9C1250a52fD3d55a',
      depositGuard: {
        address: '0x6768D9cEC5e1C4f416685dBfCFa4F92E660dc129',
        version: 1,
      },
      vaultDeployerAddress: '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e',
      isAlgebra: true,
      ammVersion: 'algebraIntegral',
      vaults: {
        '0x47e8ca40666102ac217286e51660a4e6e6d7f9a3': ['0xd125e12af8aec4c8ebaf2ebf1f17b1e09b2e1227'], // Vault for USDC-WETH
      },
    },
  },
};

export const MULTICALL_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.Base]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
  [SupportedChainId.BaseSepolia]: '0xf08e7861984cb4d2ba8b69e3c4ae20443dfa3c31',
};
