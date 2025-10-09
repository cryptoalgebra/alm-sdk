import { SupportedChainId } from '../types';

/* externally */
export const VAULT_DEPOSIT_GUARD: Record<SupportedChainId, string> = {
  [SupportedChainId.Base]: '0x1e18b4a180b13520bD202e571cD9dFE0A545Cc85', // clamm 1.2.1
  [SupportedChainId.BaseSepolia]: '0x957f89cfE2bdA878562c59d2d00BE0f8b910BCe8', // integral 1.2.2 farming + alm + ve33
};

/* internally */
export const VAULT_DEPLOYER: Record<SupportedChainId, string> = {
  [SupportedChainId.Base]: '0x00009cc27c811a3e0FdD2Fd737afCc721B67eE8e',
  [SupportedChainId.BaseSepolia]: '0xDeaD1F5aF792afc125812E875A891b038f888258',
};
export const MULTICALL3_ADDRESSES: Partial<Record<SupportedChainId, string>> = {
  [SupportedChainId.Base]: '0x091e99cb1C49331a94dD62755D168E941AbD0693',
  [SupportedChainId.BaseSepolia]: '0xca11bde05977b3631167028862be2a173976ca11',
};
