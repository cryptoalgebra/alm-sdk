import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, ContractTransaction, Overrides } from 'ethers';
import { AddressZero } from '@ethersproject/constants';
import { parseUnits } from '@ethersproject/units';
import { getERC20Contract, getFarmingRewardsDistributorContract } from '../contracts';
import { calculateGasMargin } from '../types/calculateGasMargin';
import { algebraVaultDecimals } from '../types';
import { getFarmingRewardsDistributorAddress } from '../utils/getFarmingRewardsDistributorAddress';

export async function stake(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  shares: string | number | BigNumber,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const {
    network: { chainId },
  } = jsonProvider;
  const signer = jsonProvider.getSigner(accountAddress);

  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, signer);

  if (farmingDistributorAddress === AddressZero) {
    throw new Error(`Farming does not exist for vault ${vaultAddress} on chain ${chainId}`);
  }

  const sharesBN = parseUnits(shares.toString(), algebraVaultDecimals);

  const vaultTokenContract = getERC20Contract(vaultAddress, signer);
  const currentAllowanceBN = await vaultTokenContract.allowance(accountAddress, farmingDistributorAddress);

  const isApproved = currentAllowanceBN.gt(BigNumber.from(0)) && currentAllowanceBN.gte(sharesBN);
  if (!isApproved) {
    throw new Error(`Stake is not approved for token, chain ${chainId}, vault ${vaultAddress}`);
  }

  const tokenContract = getERC20Contract(vaultAddress, jsonProvider);
  const userTokenBalance = await tokenContract.balanceOf(accountAddress);

  if (userTokenBalance.lt(sharesBN)) {
    throw new Error(`Stake amount exceeds user token amount, chain ${chainId}`);
  }

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(await farmingDistributorContract.estimateGas.stake(sharesBN, accountAddress));

  const tx = await farmingDistributorContract.stake(sharesBN, accountAddress, {
    ...overrides,
    gasLimit,
  });

  return tx;
}

export async function unstake(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  shares: string | number | BigNumber,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const signer = jsonProvider.getSigner(accountAddress);

  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, signer);

  const sharesBN = parseUnits(shares.toString(), algebraVaultDecimals);

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(await farmingDistributorContract.estimateGas.unstake(sharesBN, { from: accountAddress }));

  const tx = await farmingDistributorContract.unstake(sharesBN, { from: accountAddress, ...overrides, gasLimit });

  return tx;
}

export async function harvest(
  accountAddress: string,
  vaultAddress: string,
  jsonProvider: JsonRpcProvider,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const signer = jsonProvider.getSigner(accountAddress);

  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, signer);

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(await farmingDistributorContract.estimateGas.getAllRewards({ from: accountAddress }));

  const tx = await farmingDistributorContract.getAllRewards({ from: accountAddress, ...overrides, gasLimit });

  return tx;
}

export async function addRewardTokenToDistributor(
  accountAddress: string,
  vaultAddress: string,
  rewardToken: string,
  jsonProvider: JsonRpcProvider,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const signer = jsonProvider.getSigner(accountAddress);

  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, signer);

  const gasLimit =
    overrides?.gasLimit ??
    calculateGasMargin(
      await farmingDistributorContract.estimateGas.addReward(rewardToken, { from: accountAddress, ...overrides }),
    );

  const tx = await farmingDistributorContract.addReward(rewardToken, { from: accountAddress, ...overrides, gasLimit });

  return tx;
}

export async function getTokenRewardAddresses(vaultAddress: string, jsonProvider: JsonRpcProvider): Promise<string[]> {
  const farmingDistributorAddress = await getFarmingRewardsDistributorAddress(vaultAddress, jsonProvider);
  const farmingDistributorContract = getFarmingRewardsDistributorContract(farmingDistributorAddress, jsonProvider);

  const [rewardTokenAddresses] = await farmingDistributorContract.claimableRewards(AddressZero);

  return rewardTokenAddresses.map((address) => address.toLowerCase());
}
