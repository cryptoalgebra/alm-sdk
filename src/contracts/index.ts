/* eslint-disable camelcase */
import { getAddress } from '@ethersproject/address';
import { JsonRpcProvider } from '@ethersproject/providers';
import { SignerOrProvider } from '../types';
import {
  ERC20__factory as ERC20Factory,
  ERC20,
  AlgebraPool__factory,
  AlgebraPool,
  AlgebraVaultDepositGuard__factory,
  AlgebraVaultDepositGuard,
  AlgebraVault__factory,
  AlgebraVault,
} from '../../abis/types';

export function getERC20Contract(address: string, signerOrProvider: SignerOrProvider): ERC20 {
  getAddress(address);
  return ERC20Factory.connect(address, signerOrProvider);
}

export function getAlgebraVaultDepositGuardContract(
  address: string,
  signerOrProvider: SignerOrProvider,
): AlgebraVaultDepositGuard {
  getAddress(address);
  return AlgebraVaultDepositGuard__factory.connect(address, signerOrProvider);
}

export function getAlgebraVaultContract(address: string, signerOrProvider: SignerOrProvider): AlgebraVault {
  getAddress(address);
  return AlgebraVault__factory.connect(address, signerOrProvider);
}

export function getAlgebraPoolContract(address: string, provider: JsonRpcProvider): AlgebraPool {
  try {
    return AlgebraPool__factory.connect(address, provider);
  } catch (e) {
    console.error(`Couldn't create AlgebraPool contract with address: ${address}`);
    throw e;
  }
}
