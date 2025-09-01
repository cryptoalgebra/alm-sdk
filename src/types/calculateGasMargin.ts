const defaultGasLimit = 5e6;
// const mantleGasLimit = 3e9;

export function getGasLimit(): number {
  // return chainId === SupportedChainId.mantle ? mantleGasLimit : defaultGasLimit;
  return defaultGasLimit;
}

export function calculateGasMargin(value: bigint): bigint {
  return (value * 12000n) / 10000n;
}
