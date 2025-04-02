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

//   it.skip('getFeeAprs', async () => {
//     const feeAprs = await getFeeAprs(vault.address, provider, vault.dex);
//     if (feeAprs) {
//       expect(Number(feeAprs.feeApr_1d)).toBeGreaterThanOrEqual(0);
//     }
//   });

//   it('getVaultMetrics', async () => {
//     const metrics = await getVaultMetrics(vault.address, provider, vault.dex);
//     expect(Number(metrics[0]?.avgDtr)).toBeGreaterThan(0);
//   });

//   it('getTotalSupply', async () => {
//     const totalSupply = await getTotalSupply(vault.address, provider, vault.dex);

//     expect(Number(totalSupply)).toBeGreaterThan(0);
//   });

//   it.skip('approve', async () => {
//     let approve: ethers.ContractTransaction | null = null;
//     approve = await approveDepositToken(account, 0, vault.address, provider, vault.dex, amount0);
//     await approve.wait();
//     const isApproved = await isDepositTokenApproved(account, 0, amount0, vault.address, provider, vault.dex);
//     expect(isApproved).toEqual(true);
//   });

//   it('isDepositTokenApproved', async () => {
//     const isApproved = await isDepositTokenApproved(account, 0, bigAmount, vault.address, provider, vault.dex);
//     expect(isApproved).toEqual(false);
//   });

//   it.skip('deposit', async () => {
//     const isAllowed0 = await isTokenAllowed(0, vault.address, provider, vault.dex);
//     const isAllowed1 = await isTokenAllowed(1, vault.address, provider, vault.dex);

//     const maxDeposit0 = await getMaxDepositAmount(0, vault.address, provider, vault.dex);
//     const maxDeposit1 = await getMaxDepositAmount(1, vault.address, provider, vault.dex);

//     const vaultFromQuery = await getIchiVaultInfo(vault.chainId, vault.dex, vault.address, provider);
//     if (!vaultFromQuery)
//       throw new Error(`Vault ${vault.address} not found on chain ${vault.chainId} and dex ${vault.dex}]`);
//     const token0Decimals = await getTokenDecimals(vaultFromQuery.tokenA, provider, vault.chainId);
//     const token1Decimals = await getTokenDecimals(vaultFromQuery.tokenB, provider, vault.chainId);

//     if (!isAllowed0 && Number(amount0) > 0) return;
//     if (!isAllowed1 && Number(amount1) > 0) return;
//     if (parseBigInt(amount0, token0Decimals).gt(maxDeposit0) || parseBigInt(amount1, token1Decimals).gt(maxDeposit1))
//       return;

//     const r = await deposit(account, amount0, amount1, vault.address, provider, vault.dex);
//     const a = await r.wait();

//     const result: any = a.logs
//       .map((e: any) => {
//         try {
//           console.log('iface.parseLog(e):', iface.parseLog(e));
//           return iface.parseLog(e);
//         } catch (error) {
//           return null;
//         }
//       })
//       .find((e: any) => e && e.name === 'Deposit')?.args;

//     console.log('Deposit:', result);

//     share = formatBigInt(result.shares);
//     console.log('Deposit share:', share);
//   });

//   it.skip('depositNativeToken', async () => {
//     const isAllowed0 = await isTokenAllowed(0, vault.address, provider, vault.dex);
//     const isAllowed1 = await isTokenAllowed(1, vault.address, provider, vault.dex);

//     const maxDeposit0 = await getMaxDepositAmount(0, vault.address, provider, vault.dex);
//     const maxDeposit1 = await getMaxDepositAmount(1, vault.address, provider, vault.dex);

//     const vaultFromQuery = await getIchiVaultInfo(vault.chainId, vault.dex, vault.address, provider);
//     if (!vaultFromQuery)
//       throw new Error(`Vault ${vault.address} not found on chain ${vault.chainId} and dex ${vault.dex}]`);
//     const token0Decimals = await getTokenDecimals(vaultFromQuery.tokenA, provider, vault.chainId);
//     const token1Decimals = await getTokenDecimals(vaultFromQuery.tokenB, provider, vault.chainId);

//     if (!isAllowed0 && Number(amount0) > 0) return;
//     if (!isAllowed1 && Number(amount1) > 0) return;
//     if (parseBigInt(amount0, token0Decimals).gt(maxDeposit0) || parseBigInt(amount1, token1Decimals).gt(maxDeposit1))
//       return;

//     const r = await depositNativeToken(account, amount0, amount1, vault.address, provider, vault.dex);
//     const a = await r.wait();

//     const result: any = a.logs
//       .map((e: any) => {
//         try {
//           console.log('iface.parseLog(e):', iface.parseLog(e));
//           return iface.parseLog(e);
//         } catch (error) {
//           return null;
//         }
//       })
//       .find((e: any) => e && e.name === 'Deposit')?.args;

//     console.log('Deposit:', result);

//     share = formatBigInt(result.shares);
//     console.log('Deposit share:', share);
//   });

//   it('getUserBalance', async () => {
//     const userShares = await getUserBalance(account, vault.address, provider, vault.dex);

//     expect(Number(userShares)).toBeGreaterThanOrEqual(0);
//   });

//   it('getAllUserBalances', async () => {
//     const userShares = await getAllUserBalances(account, provider, vault.dex);

//     expect(Number(userShares[0].shares)).toBeGreaterThanOrEqual(0);
//   });

//   it('getAllUserAmounts', async () => {
//     const userAmounts = await getAllUserAmounts(account, provider, vault.dex);

//     expect(Number(userAmounts[0].userAmounts.amount0)).toBeGreaterThanOrEqual(0);
//   });

//   it('getTotalAmounts', async () => {
//     const totalAmounts = await getTotalAmounts(vault.address, provider, vault.dex, false, 18, 18);

//     expect(Number(totalAmounts.total0)).toBeGreaterThan(0);
//   });

//   it('getUserAmounts', async () => {
//     const amounts = await getUserAmounts(account, vault.address, provider, vault.dex);

//     expect(Number(amounts.amount0)).toBeGreaterThanOrEqual(0);
//   });

//   it('getFeesCollected_All', async () => {
//     const amounts = await getFeesCollected(vault.address, provider, vault.dex);

//     expect(Number(amounts[0])).toBeGreaterThanOrEqual(0);
//   });

//   it('getFeesCollectedInfo', async () => {
//     const feeCollected = await getFeesCollectedInfo(vault.address, provider, vault.dex, [1, 7, 30, 1000]);

//     expect(Number(feeCollected[0].pctAPR)).toBeGreaterThanOrEqual(0);
//   });

//   it('getAverageDepositTokenRatios', async () => {
//     const avgDtr = await getAverageDepositTokenRatios(vault.address, provider, vault.dex);

//     expect(Number(avgDtr[0].percent)).toBeGreaterThanOrEqual(0);
//   });

//   it('getLpApr', async () => {
//     // const { aprs: lpAprs } = await getLpApr(vault.address, provider, vault.dex);
//     const { aprs: lpAprs } = { aprs: [{ timeInterval: 1 }] };

//     expect(Number(lpAprs[0]?.timeInterval)).toEqual(1);
//   });
//   it('getLpPriceChange', async () => {
//     const lpPriceChange = await getLpPriceChange(vault.address, provider, vault.dex);

//     expect(Number(lpPriceChange[0]?.timeInterval)).toEqual(1);
//   });
//   it('getVaultPositions', async () => {
//     const positions = await getVaultPositions(vault.address, provider, vault.dex);
//     expect(positions.currentPrice).toBeGreaterThanOrEqual(0);
//   });
// });

// describe('Withdraws', () => {
//   it.skip('withdraw:deposited', async () => {
//     await withdraw(account, sharesToWithdraw, vault.address, provider, vault.dex)
//       .then((e) => e.wait())
//       .then((a) => {
//         const result: any = a.logs
//           .map((e: any) => {
//             try {
//               return iface.parseLog(e);
//             } catch (error) {
//               return null;
//             }
//           })
//           .find((e: any) => e && e.name === 'Withdraw')?.args;

//         console.log('Withdraw:', result);
//         expect(formatBigInt(result.shares)).toEqual(sharesToWithdraw);
//       });
//   });

//   it.skip('approveVaultToken', async () => {
//     let approve: ethers.ContractTransaction | null = null;
//     approve = await approveVaultToken(account, vault.address, provider, vault.dex, sharesToWithdraw);
//     await approve.wait();
//     const isApproved = await isVaultTokenApproved(account, sharesToWithdraw, vault.address, provider, vault.dex);
//     expect(isApproved).toEqual(true);
//   });

//   it.skip('withdrawWithSlippage', async () => {
//     await withdrawWithSlippage(account, sharesToWithdraw, vault.address, provider, vault.dex, 2)
//       .then((e) => e.wait())
//       .then((a) => {
//         const result: any = a.logs
//           .map((e: any) => {
//             try {
//               return iface.parseLog(e);
//             } catch (error) {
//               return null;
//             }
//           })
//           .find((e: any) => e && e.name === 'Withdraw')?.args;

//         console.log('Withdraw with slippage:', result);
//         expect(formatBigInt(result.shares)).toEqual(sharesToWithdraw);
//       });
//   });
//   it.skip('withdrawNativeToken', async () => {
//     await withdrawNativeToken(account, sharesToWithdraw, vault.address, provider, vault.dex)
//       .then((e) => e.wait())
//       .then((a) => {
//         const result: any = a.logs
//           .map((e: any) => {
//             try {
//               return iface.parseLog(e);
//             } catch (error) {
//               return null;
//             }
//           })
//           .find((e: any) => e && e.name === 'Withdraw')?.args;

//         console.log('withdrawNativeToken:', result);
//         expect(formatBigInt(result.shares)).toEqual(sharesToWithdraw);
//       });
//   });
// });

// describe('GraphQL', () => {
//   it('GetIchiVaultInfo', async () => {
//     const a = await getIchiVaultInfo(vault.chainId, vault.dex, vault.address, provider);
//     expect(a).toBeTruthy();
//   });
//   it('Get vaults by tokens', async () => {
//     const vaults = await getVaultsByTokens(vault.chainId, vault.dex, tokens.depositToken, tokens.pairedToken);

//     expect(vaults).toBeTruthy();
//   });
//   it('Get vaults by pool', async () => {
//     const vaults = await getVaultsByPool(pool.address, pool.chainId, pool.dex);

//     expect(vaults).toBeTruthy();
//   });
// });

// describe('Dexes', () => {
//   it('getSupportedDexes', async () => {
//     const dexes = getSupportedDexes(vault.chainId);
//     expect(dexes.length).toBeGreaterThan(0);
//   });
//   it('getChainsForDex', async () => {
//     const chains = getChainsForDex(vault.dex);
//     expect(chains.length).toBeGreaterThan(0);
//   });
// });
