import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Interface } from '@ethersproject/abi';
import { BigNumber, Signer } from 'ethers';
import { SupportedChainId } from '../types';
import { MULTICALL_ADDRESSES } from './config/addresses';
import { getERC20Contract, getIchiVaultContract } from '../contracts';
import multicallAbi from '../abis/multicall.json';

interface Call {
  target: string;
  gasLimit: number;
  callData: string;
}

export interface Result {
  success: boolean;
  gasUsed: BigNumber;
  returnData: string;
}

interface MulticallResponse {
  blockNumber: BigNumber;
  returnData: Result[];
}

export function getMulticallContract(chainId: SupportedChainId, provider: Provider | Signer): Contract {
  const address = MULTICALL_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`Multicall not supported on chain ${chainId}`);
  }
  return new Contract(address, multicallAbi, provider);
}

export async function multicall(
  calls: Call[],
  chainId: SupportedChainId,
  provider: Provider | Signer,
): Promise<Result[]> {
  const multicallContract = getMulticallContract(chainId, provider);
  const { returnData }: MulticallResponse = await multicallContract.callStatic.multicall(calls);
  return returnData;
}

export function encodeTotalAmountsCall(vaultAddress: string): Call {
  const vaultInterface = new Interface(getIchiVaultContract(vaultAddress, null as any).interface.format());
  return {
    target: vaultAddress,
    gasLimit: 1000000,
    callData: vaultInterface.encodeFunctionData('getTotalAmounts'),
  };
}

export function encodeTotalSupplyCall(vaultAddress: string): Call {
  const vaultInterface = new Interface(getIchiVaultContract(vaultAddress, null as any).interface.format());
  return {
    target: vaultAddress,
    gasLimit: 1000000,
    callData: vaultInterface.encodeFunctionData('totalSupply'),
  };
}

export function encodeDecimalsCall(tokenAddress: string): Call {
  const tokenInterface = new Interface(getERC20Contract(tokenAddress, null as any).interface.format());
  return {
    target: tokenAddress,
    gasLimit: 1000000,
    callData: tokenInterface.encodeFunctionData('decimals'),
  };
}

export function decodeTotalAmountsResult(
  result: Result,
  vaultAddress: string,
): { total0: BigNumber; total1: BigNumber } {
  if (!result.success) {
    throw new Error('Failed to get total amounts');
  }
  const vaultInterface = new Interface(getIchiVaultContract(vaultAddress, null as any).interface.format());
  const decoded = vaultInterface.decodeFunctionResult('getTotalAmounts', result.returnData);
  return {
    total0: decoded[0],
    total1: decoded[1],
  };
}

export function decodeTotalSupplyResult(result: Result, vaultAddress: string): BigNumber {
  if (!result.success) {
    throw new Error('Failed to get total supply');
  }
  const vaultInterface = new Interface(getIchiVaultContract(vaultAddress, null as any).interface.format());
  return vaultInterface.decodeFunctionResult('totalSupply', result.returnData)[0];
}

export function decodeDecimalsResult(result: Result, tokenAddress: string): number {
  if (!result.success) {
    throw new Error('Failed to get decimals');
  }
  const tokenInterface = new Interface(getERC20Contract(tokenAddress, null as any).interface.format());
  return tokenInterface.decodeFunctionResult('decimals', result.returnData)[0];
}
