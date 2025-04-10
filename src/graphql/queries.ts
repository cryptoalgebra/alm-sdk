// eslint-disable-next-line import/no-unresolved
import { gql } from 'graphql-request';

export function vaultQueryAlgebra() {
  return gql`
    query ($vaultAddress: String!) {
      almVault(id: $vaultAddress) {
        id
        token0
        token1
        allowToken0
        allowToken1
        holdersCount
      }
    }
  `;
}

export function vaultByTokensQuery() {
  return gql`
    query ($addressTokenA: String!, $addressTokenB: String!) {
      almVaults(where: { token0: $addressTokenA, token1: $addressTokenB }) {
        id
        token0
        token1
        allowToken0
        allowToken1
      }
    }
  `;
}

export const vaultByPoolQuery = gql`
  query ($poolAddress: String!) {
    almVaults(where: { pool: $poolAddress }) {
      id
    }
  }
`;

export const allVaultsQuery = gql`
  query {
    almVaults {
      pool
      id
      token0
      token1
      allowToken0
      allowToken1
      totalSupply
      totalAmount0
      totalAmount1
      feeApr_1d
      feeApr_30d
      feeApr_3d
      feeApr_7d
    }
  }
`;

export const rebalancesQuery = (page: number) => gql`
  query ($vaultAddress: String!, $createdAtTimestamp_gt: String!) {
    vaultRebalances(first:1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      feeAmount0
      feeAmount1
      totalAmount0
      totalAmount1
      createdAtTimestamp
      vault
      sqrtPrice
      totalSupply
    }
  }
`;

export const vaultCollectFeesQuery = (page: number) => gql`
  query ($vaultAddress: String!, $createdAtTimestamp_gt: String!) {
    vaultCollectFees(first: 1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      feeAmount0
      feeAmount1
      totalAmount0
      totalAmount1
      createdAtTimestamp
      vault
      sqrtPrice
      totalSupply
    }
  }
`;

export const vaultDepositsQuery = (page: number) => gql`
  query ($vaultAddress: String!, $createdAtTimestamp_gt: String!) {
    vaultDeposits(first: 1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      vault
      createdAtTimestamp
      totalAmount0
      totalAmount1
      totalAmount0BeforeEvent
      totalAmount1BeforeEvent
      sqrtPrice
      totalSupply
    }
  }
`;

export const vaultWithdrawsQuery = (page: number) => gql`
  query ($vaultAddress: String!, $createdAtTimestamp_gt: String!) {
    vaultWithdraws(first: 1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      createdAtTimestamp
      totalAmount0
      totalAmount1
      totalAmount0BeforeEvent
      totalAmount1BeforeEvent
      vault
      sqrtPrice
      totalSupply
    }
  }
`;

export const allEventsQuery = (page: number) => gql`
  query ($vaultAddress: String!, $createdAtTimestamp_gt: String!) {
    vaultRebalances(first:1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      feeAmount0
      feeAmount1
      totalAmount0
      totalAmount1
      createdAtTimestamp
      vault
      sqrtPrice
      totalSupply
    },
    vaultCollectFees(first: 1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      feeAmount0
      feeAmount1
      totalAmount0
      totalAmount1
      createdAtTimestamp
      vault
      sqrtPrice
      totalSupply
    },
    vaultDeposits(first: 1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      vault
      createdAtTimestamp
      totalAmount0
      totalAmount1
      totalAmount0BeforeEvent
      totalAmount1BeforeEvent
      sqrtPrice
      totalSupply
    },
    vaultWithdraws(first: 1000, skip: ${
      page * 1000
    }, where: { vault: $vaultAddress, createdAtTimestamp_gt: $createdAtTimestamp_gt }) {
      createdAtTimestamp
      totalAmount0
      totalAmount1
      totalAmount0BeforeEvent
      totalAmount1BeforeEvent
      vault
      sqrtPrice
      totalSupply
    }
  }
`;

export function userBalancesQuery() {
  return gql`
    query ($accountAddress: String!) {
      vaultShares(where: { user: $accountAddress }) {
        vault {
          id
          token0
          token1
        }
        vaultShareBalance
      }
    }
  `;
}

export const feeAprQuery = gql`
  query ($vaultAddress: String!) {
    almVault(id: $vaultAddress) {
      feeApr_1d
      feeApr_3d
      feeApr_7d
      feeApr_30d
    }
  }
`;
