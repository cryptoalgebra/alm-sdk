// eslint-disable-next-line import/no-extraneous-dependencies
import { BigNumber as BN } from 'bignumber.js';
import { BigNumber } from 'ethers';

export default function formatBigInt(value: number | string | BigNumber, decimals: number = 18): string {
  const bigVal = new BN(value.toString());
  const divisor = new BN(10).pow(decimals);

  return bigVal.div(divisor).toString();
}
