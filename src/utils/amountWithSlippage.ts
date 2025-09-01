export default function amountWithSlippage(amount: bigint, percentSlippage: number): bigint {
  // Calculate slippage multiplier as a number first, then convert to BigInt
  const slippageMultiplier = Math.floor((100 - percentSlippage) * 1000);
  return (amount * BigInt(slippageMultiplier)) / 100000n;
}
