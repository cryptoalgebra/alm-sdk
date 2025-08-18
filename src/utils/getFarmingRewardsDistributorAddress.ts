import { JsonRpcProvider } from '@ethersproject/providers';
import { getAlgebraVaultContract } from '../contracts';

// eslint-disable-next-line import/prefer-default-export
export async function getFarmingRewardsDistributorAddress(
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
): Promise<string> {
  const vaultContract = getAlgebraVaultContract(vaultAddress, jsonProvider);
  const farmingDistributorAddress = await vaultContract.farmingRewardsDistributor();

  return farmingDistributorAddress;
}
