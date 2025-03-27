/* eslint-disable camelcase */
import { getAddress } from '@ethersproject/address';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SignerOrProvider } from '../types';
import {
  ERC20__factory as ERC20Factory,
  ERC20,
  UniswapV3Pool__factory,
  AlgebraPool__factory,
  UniswapV3Pool,
  AlgebraPool,
  AlgebraIntegralPool,
  AlgebraIntegralPool__factory,
  AlgebraVaultDepositGuard__factory,
  AlgebraVaultDepositGuard,
  AlgebraVault__factory,
  AlgebraVault,
} from '../../abis/types';

export function getERC20Contract(address: string, signerOrProvider: SignerOrProvider): ERC20 {
  getAddress(address);
  return ERC20Factory.connect(address, signerOrProvider);
}

export function getDepositGuardContract(address: string, signerOrProvider: SignerOrProvider): AlgebraVaultDepositGuard {
  getAddress(address);
  return AlgebraVaultDepositGuard__factory.connect(address, signerOrProvider);
}

export function getIchiVaultContract(address: string, signerOrProvider: SignerOrProvider): AlgebraVault {
  getAddress(address);
  return AlgebraVault__factory.connect(address, signerOrProvider);
}

export function getUniswapV3PoolContract(address: string, provider: JsonRpcProvider): UniswapV3Pool {
  try {
    return UniswapV3Pool__factory.connect(address, provider);
  } catch (e) {
    console.error(`Couldn't create UniswapV3Pool contract with address: ${address}`);
    throw e;
  }
}
export function getAlgebraPoolContract(address: string, provider: JsonRpcProvider): AlgebraPool {
  try {
    return AlgebraPool__factory.connect(address, provider);
  } catch (e) {
    console.error(`Couldn't create AlgebraPool contract with address: ${address}`);
    throw e;
  }
}
export function getAlgebraIntegralPoolContract(address: string, provider: JsonRpcProvider): AlgebraIntegralPool {
  try {
    return AlgebraIntegralPool__factory.connect(address, provider);
  } catch (e) {
    console.error(`Couldn't create AlgebraIntegralPool contract with address: ${address}`);
    throw e;
  }
}
