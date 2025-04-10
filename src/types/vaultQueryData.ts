// eslint-disable-next-line import/no-cycle
import { AlgebraVault, Fees, VaultTransactionEvent, UserBalances, FeeAprData } from '..';

export interface VaultQueryData {
  almVault: AlgebraVault;
}

export interface VaultsByTokensQueryData {
  almVaults: AlgebraVault[];
}
export interface VaultsByPoolQueryData {
  almVaults: { id: string }[];
}

export interface RebalancesQueryData {
  vaultRebalances: Fees[];
}
export interface CollectFeesQueryData {
  vaultCollectFees: Fees[];
}
export interface VaultDepositsQueryData {
  vaultDeposits: VaultTransactionEvent[];
}
export interface VaultWithdrawsQueryData {
  vaultWithdraws: VaultTransactionEvent[];
}

export interface UserBalancesQueryData {
  vaultShares: UserBalances;
}

export interface FeeAprQueryResponse {
  almVault: FeeAprData | null;
}
