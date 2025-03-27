import { BigNumber } from 'ethers';

export default function amountWithSlippage(amount: BigNumber, percentSlippage: number): BigNumber {
  return amount.mul(Math.floor((100 - percentSlippage) * 1000)).div(100000);
}
