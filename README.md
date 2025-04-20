# Algebra ALM SDK
This SDK provides utilities for interacting with Algebra ALM vaults, designed to simplify integration into your project.

## 📦 Installation
Using npm:
```bash
npm install @cryptoalgebra/alm-sdk
```
or yarn:
```bash
yarn add @cryptoalgebra/alm-sdk
```

## 🧾 Project Structure
- Contract addresses:
https://github.com/cryptoalgebra/alm-sdk/blob/main/src/config/addresses.ts

- Subgraph endpoints:
https://github.com/cryptoalgebra/alm-sdk/blob/main/src/graphql/constants.ts

- Checklist for updating addresses (frontend integration):
https://github.com/cryptoalgebra/alm-sdk/blob/main/redeploy-checklist.md

## ⚙️ Blockchain Interaction
This SDK uses ethers.js for blockchain interactions (calls, sending transactions). It is also compatible with viem/wagmi via [Viem/Wagmi Provider conversion](https://github.com/cryptoalgebra/clamm-ui/blob/clamm-base/src/hooks/common/useEthersProvider.ts)

## 📚 Vault GET Methods

- `getVaultsByPool`

Get a list of vault addresses associated with a specific pool
```ts
const vaultAddresses: string[] = await getVaultsByPool(poolAddress, chainId, dex);
```

- `getExtendedAlgebraVault`

Retrieve extended vault information, including token addresses, deposit token, vault TVL in each token, and 24h APR
```ts
const vaultData: ExtendedAlgebraVault = await getExtendedAlgebraVault(
    vaultAddress,
    dex,
    chainId,
    provider,
    token0.decimals,
    token1.decimals
);
```

- `getTotalAmounts`

Returns the total number of both tokens stored in the vault
```ts
const [totalAmount0, totalAmount1] = await getTotalAmounts(
    vaultAddress,
    provider,
    dex,
    true,
    token0.decimals,
    token1.decimals
);
```

- `getTotalSupply`
  
Returns the total number of vault shares
```ts
const totalSupply = await getTotalSupply(vaultAddress, provider, dex)
```

## 👤 User Data in Vaults

- `getUserAmounts`

Returns the user's token balances and share count in the vault. If the `raw` flag is set, values are returned as BigNumbers
```ts
const [userAmount0, userAmount1, shares] = await getUserAmounts(
    account,
    vaultAddress,
    provider,
    dex,
    token0.decimals,
    token1.decimals,
    true
);
```

- `calculateUserDepositTokenPNL`

Calculates the user’s PNL and ROI in terms of the deposit token
```ts
const { pnl, roi } = await calculateUserDepositTokenPNL(
    account,
    vaultAddress,
    userAmount0.toString(),
    userAmount1.toString(),
    token0.decimals,
    token1.decimals,
    provider,
    dex
);
```

## 🚀 Transactions

- `approveDepositToken` 

Approves a token for deposit. Must be called before using the `deposit()` method. The amount can be a string or number in major units.
```ts
const tx = await approveDepositToken(
    accountAddress,
    0, // token idx can be 0 or 1
    vaultAddress,
    provider,
    dex,
    amount // (optional)
);
```

- `deposit` / `depositNativeToken`

Performs a deposit into the vault. The `amount0` and `amount1` parameters represent the amounts of each token in major units.
```ts
if (useNativeToken) {
    const tx = await depositNativeToken(
        account,
        vault.allowTokenA ? amount : "0",
        vault.allowTokenB ? amount : "0",
        vaultAddress,
        provider,
        dex
    );
} else {
    const tx = await deposit(
        account,
        vault.allowTokenA ? amount : "0",
        vault.allowTokenB ? amount : "0",
        vaultAddress,
        provider,
        dex
    );
}
```

- `withdraw` / `withdrawNativeToken`

Withdraws a specified number of shares from the vault, returning both underlying tokens to the user. The share amount should be a string or number in major units.
```ts
const percentMultiplier = 1; // 100%
const shareToWithdraw = Number(userShare) * percentMultiplier;

if (useNativeToken) {
   const tx = await withdrawNativeToken(
        account,
        shareToWithdraw,
        vaultAddress,
        provider,
        dex
    );
} else {
   const tx = await withdraw(
        account,
        shareToWithdraw,
        vaultAddress,
        provider,
        dex
    );
}
```

## 🔗 Examples & Integration:
- [Viem/Wagmi Provider conversion](https://github.com/cryptoalgebra/clamm-ui/blob/clamm-base/src/hooks/common/useEthersProvider.ts)
- [ALM Vaults data](https://github.com/cryptoalgebra/clamm-ui/blob/clamm-base/src/hooks/alm/useALMVaults.ts)
- [User Data in Vaults](https://github.com/cryptoalgebra/clamm-ui/blob/clamm-base/src/hooks/alm/useUserALMVaults.ts)
- [Approve](https://github.com/cryptoalgebra/clamm-ui/blob/59d9813d2e6a5b365df5e54781e96d2faaf92524/src/components/create-position/AddAutomatedLiquidityButton/index.tsx#L38)
- [Deposit](https://github.com/cryptoalgebra/clamm-ui/blob/59d9813d2e6a5b365df5e54781e96d2faaf92524/src/components/create-position/AddAutomatedLiquidityButton/index.tsx#L54)
- [Withdraw](https://github.com/cryptoalgebra/clamm-ui/blob/59d9813d2e6a5b365df5e54781e96d2faaf92524/src/components/modals/RemoveALMLiquidityModal/index.tsx#L42)
