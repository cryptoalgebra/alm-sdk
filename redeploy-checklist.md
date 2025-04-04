# ALM Address Update Checklist
app.clamm.io as an Example

## alm-sdk
- Deposit guard address - [depositGuardAddress](https://github.com/cryptoalgebra/alm-sdk/blob/8d4a33ce1c0b269396ba13b7a159accc1705aeb3/src/config/addresses.ts#L17C7-L17C26)
- Vault deployer address - [vaultDeployerAddress](https://github.com/cryptoalgebra/alm-sdk/blob/8d4a33ce1c0b269396ba13b7a159accc1705aeb3/src/config/addresses.ts#L18)
- Mapping pool -> vaults - [vaults.json](https://github.com/cryptoalgebra/alm-sdk/blob/main/src/config/vaults.json#L4)

## router-3
- Routing through pools with the ALM plugin [CUSTOM_POOL_DEPLOYER_ALM](https://github.com/cryptoalgebra/router-3/blob/7b606c3171c21abfcd8d5e2e02779fbebff1ab32/evm/constants/addresses.ts#L42)

## clamm-ui
- Creating pools with the ALM plugin - [CUSTOM_POOL_DEPLOYER_ALM](https://github.com/cryptoalgebra/clamm-ui/blob/ac1a9634d18f3f2d88a6545f8cd144bbea21accd/src/constants/addresses.ts#L64)
- Approving tokens for deposit to the ALM Vault - [VAULT_DEPOSIT_GUARD](https://github.com/cryptoalgebra/clamm-ui/blob/ac1a9634d18f3f2d88a6545f8cd144bbea21accd/src/constants/addresses.ts#L68)
- Pool addresses for marking them in the pools table - [ALM_POOLS](https://github.com/cryptoalgebra/clamm-ui/blob/ac1a9634d18f3f2d88a6545f8cd144bbea21accd/src/constants/addresses.ts#L73C14-L73C23)
