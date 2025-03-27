import { BigNumber } from '@ethersproject/bignumber';

const defaultGasLimit = 5e6;
// const mantleGasLimit = 3e9;

export function getGasLimit(): number {
  // return chainId === SupportedChainId.mantle ? mantleGasLimit : defaultGasLimit;
  return defaultGasLimit;
}

export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000 + 2000)).div(BigNumber.from(10000));
}
