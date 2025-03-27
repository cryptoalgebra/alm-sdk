import { BigNumber } from 'ethers';

const univ3prices = require('@thanpolas/univ3prices');

// calculate price/ratio in the pool
export default function getPrice(
  isInverted: boolean,
  sqrtPrice: BigNumber,
  decimals0: number,
  decimals1: number,
  decimalPlaces = 3,
): number {
  let decimalArray = [decimals0, decimals1];
  if (isInverted) {
    decimalArray = [decimals1, decimals0];
  }
  const price = univ3prices(decimalArray, sqrtPrice).toSignificant({
    reverse: isInverted,
    decimalPlaces,
  });

  return price;
}
