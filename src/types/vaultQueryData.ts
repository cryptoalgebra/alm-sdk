// eslint-disable-next-line import/no-cycle
import { AlgebraVault, Fees, VaultTransactionEvent, UserBalances, FeeAprData } from '..';

export interface VaultQueryData {
  ichiVault: AlgebraVault;
}

export interface VaultsByTokensQueryData {
  ichiVaults: AlgebraVault[];
}
export interface VaultsByPoolQueryData {
  deployICHIVaults: string[];
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
  user: UserBalances;
}

export interface FeeAprQueryResponse {
  ichiVault: FeeAprData | null;
}
