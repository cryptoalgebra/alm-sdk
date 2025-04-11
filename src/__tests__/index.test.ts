// /* eslint-disable import/no-extraneous-dependencies */
// /* eslint-disable no-undef */

// import 'dotenv/config';

// import HDWalletProvider from '@truffle/hdwallet-provider';
// import { Web3Provider } from '@ethersproject/providers';
// import { ethers } from 'ethers';
// import { SupportedDex, SupportedChainId } from '../types';
// import ICHIVAULT_ABI from '../abis/IchiVault.json';
// import {
//   withdraw,
//   deposit,
//   getMaxDepositAmount,
//   isTokenAllowed,
//   getTotalAmounts,
//   getIchiVaultInfo,
//   isDepositTokenApproved,
//   approveDepositToken,
//   getTotalSupply,
//   getUserAmounts,
//   getUserBalance,
//   getVaultsByTokens,
//   getFeesCollected,
//   getFeesCollectedInfo,
//   getAverageDepositTokenRatios,
//   depositNativeToken,
//   getLpPriceChange,
//   getAllUserBalances,
//   getAllUserAmounts,
//   getVaultMetrics,
//   withdrawWithSlippage,
//   approveVaultToken,
//   isVaultTokenApproved,
//   withdrawNativeToken,
//   getVaultsByPool,
//   getVaultPositions,
//   getSupportedDexes,
//   getChainsForDex,
//   getFeeAprs,
// } from '../index';
// import formatBigInt from '../utils/formatBigInt';
// import parseBigInt from '../utils/parseBigInt';
// import { getTokenDecimals } from '../functions/_totalBalances';

// const hdWalletProvider = new HDWalletProvider([process.env.PRIVATE_KEY!], process.env.PROVIDER_URL!, 0, 1);

// const provider = new Web3Provider(hdWalletProvider, {
//   chainId: SupportedChainId.Base,
//   name: 'Base',
// });
// const account = process.env.ACCOUNT!;

// const vault = {
//   address: '0x0def612e7a7b51ca7ee38f7905da809bd3491268',
//   chainId: SupportedChainId.Base,
//   dex: SupportedDex.Henjin,
// };

// const pool = {
//   address: '0x1123E75b71019962CD4d21b0F3018a6412eDb63C',
//   chainId: SupportedChainId.Base,
//   dex: SupportedDex.Henjin,
// };

// const tokens = {
//   pairedToken: '0x0EF4A107b48163ab4b57FCa36e1352151a587Be4',
//   depositToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
// };

// const iface = new ethers.utils.Interface(ICHIVAULT_ABI);
// const amount0 = '10';
// const amount1 = '0';
// const sharesToWithdraw = '0.00004';
// const bigAmount = '1000';

// describe('Vault', () => {
//   let share: string | null = null;

//   it('getVaultMetrics', async () => {
//     const metrics = await getVaultMetrics(vault.address, provider, vault.dex);
//     expect(Number(metrics[0]?.avgDtr)).toBeGreaterThan(0);
//   });
// })
