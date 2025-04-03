// eslint-disable-next-line import/no-unresolved
import { JsonRpcProvider } from '@ethersproject/providers';
import { SupportedDex } from '../types';
// eslint-disable-next-line import/no-cycle
import { validateVaultData } from './vault';
import { getAlgebraVaultContract } from '../contracts';
import formatBigInt from '../utils/formatBigInt';

const univ3prices = require('@thanpolas/univ3prices');

export type VaultPositionsInfo = {
  currentTick: number;
  currentPrice: number;
  positions: {
    tickLower: number;
    tickUpper: number;
    priceLower: number;
    priceUpper: number;
    liquidity: string;
    amountToken0: string;
    amountToken1: string;
    positionTvl: number;
  }[];
};

function getPriceAtTick(decimals: [number, number], tick: number): number {
  const price = univ3prices.tickPrice(decimals, tick);
  return price;
}

// get price at tick in deposit tokens
function getPriceInDepositToken(isVaultInverted: boolean, decimals: [number, number], tick: number): number {
  const priceFromPool = getPriceAtTick(decimals, tick);
  const result =
    (isVaultInverted && tick > 0) || (!isVaultInverted && tick < 0)
      ? Number(priceFromPool.toFixed())
      : 1 / Number(priceFromPool.toFixed());
  return result;
}

export async function getVaultPositions(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  dex: SupportedDex,
  decimals0?: number,
  decimals1?: number,
): Promise<VaultPositionsInfo> {
  const { vault } = await validateVaultData(vaultAddress, jsonProvider, dex);
  const tokenDecimals = [decimals0, decimals1] as [number, number];
  const isInv = vault.allowTokenB;
  const vaultContract = getAlgebraVaultContract(vaultAddress, jsonProvider);
  try {
    const currentTick = await vaultContract.currentTick();
    // const [baseLower, baseUpper, basePosition] = await Promise.all([
    //   vaultContract.baseLower(),
    //   vaultContract.baseUpper(),
    //   vaultContract.getBasePosition(),
    // ]);
    const [limitLower, limitUpper, limitPosition] = await Promise.all([
      vaultContract.limitLower(),
      vaultContract.limitUpper(),
      vaultContract.getLimitPosition(),
    ]);
    // const priceAtBaseLower = getPriceInDepositToken(isInv, tokenDecimals, baseLower);
    // const priceAtBaseUpper = getPriceInDepositToken(isInv, tokenDecimals, baseUpper);
    const priceAtLimitLower = getPriceInDepositToken(isInv, tokenDecimals, limitLower);
    const priceAtLimitUpper = getPriceInDepositToken(isInv, tokenDecimals, limitUpper);
    const currentPrice = getPriceInDepositToken(isInv, tokenDecimals, currentTick);
    // const basePositionTvl = !isInv
    //   ? Number(formatBigInt(basePosition.amount0, decimals0)) +
    //     Number(formatBigInt(basePosition.amount1, decimals1)) * currentPrice
    //   : Number(formatBigInt(basePosition.amount1, decimals1)) +
    //     Number(formatBigInt(basePosition.amount0, decimals0)) * currentPrice;
    const limitPositionTvl = !isInv
      ? Number(formatBigInt(limitPosition.amount0, decimals0)) +
        Number(formatBigInt(limitPosition.amount1, decimals1)) * currentPrice
      : Number(formatBigInt(limitPosition.amount1, decimals1)) +
        Number(formatBigInt(limitPosition.amount0, decimals0)) * currentPrice;

    return {
      currentTick,
      currentPrice,
      positions: [
        // {
        //   tickLower: baseLower,
        //   tickUpper: baseUpper,
        //   priceLower: priceAtBaseLower,
        //   priceUpper: priceAtBaseUpper,
        //   liquidity: basePosition.liquidity.toString(),
        //   amountToken0: basePosition.amount0.toString(),
        //   amountToken1: basePosition.amount1.toString(),
        //   positionTvl: basePositionTvl,
        // },
        {
          tickLower: limitLower,
          tickUpper: limitUpper,
          priceLower: priceAtLimitLower,
          priceUpper: priceAtLimitUpper,
          liquidity: limitPosition.liquidity.toString(),
          amountToken0: limitPosition.amount0.toString(),
          amountToken1: limitPosition.amount1.toString(),
          positionTvl: limitPositionTvl,
        },
      ],
    };
  } catch (e) {
    console.error(`Could not get vault positions for vault ${vaultAddress} `);
    throw e;
  }
}
