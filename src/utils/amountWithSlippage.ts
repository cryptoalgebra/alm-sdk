export default function amountWithSlippage(amount: bigint, percentSlippage: number): bigint {
  return (amount * BigInt(Math.floor((100 - percentSlippage) * 1000))) / 100000n;
}
