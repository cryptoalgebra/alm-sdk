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
  [SupportedChainId.Base]: {
    [SupportedDex.Henjin]: {
      factoryAddress: '0x51a0D74e1791399cE02aafD9a21dc4637Fe57959',
      depositGuard: {
        address: '0xc7944fB8e8F4c89e7D8a997F59F2efec3Ce02B12',
        version: 2,
      },
      vaultDeployerAddress: '0x7d11De61c219b70428Bb3199F0DD88bA9E76bfEE',
      isAlgebra: true,
      ammVersion: 'algebraIntegral',
      vaults: {
        '0x3a619042a383edb747d6b5ea915583c7cd844720': [
          '0xf4d5433d0a5dd5dc4e2419b9d7a126a1a0089251',
          '0x0761f81f17a6b87ea47fa56e1b81eaf675e8ac43',
        ],
      },
    },
    [SupportedDex.CLAMM]: {
      factoryAddress: '0x51a0D74e1791399cE02aafD9a21dc4637Fe57959',
      depositGuard: {
        address: '0xc7944fB8e8F4c89e7D8a997F59F2efec3Ce02B12',
        version: 2,
      },
      vaultDeployerAddress: '0x7d11De61c219b70428Bb3199F0DD88bA9E76bfEE',
      isAlgebra: true,
      ammVersion: 'algebraIntegral',
      vaults: {
        '0x4f35d267cebfcc557123de0e18ff2386e252f7b8': [
          '0xf4d5433d0a5dd5dc4e2419b9d7a126a1a0089251',
          '0x0761f81f17a6b87ea47fa56e1b81eaf675e8ac43',
        ],
      },
    },
  },
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
