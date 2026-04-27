## ADDED Requirements

### Requirement: Money is represented exactly in minor units

The system SHALL represent all monetary amounts as a pair `{ amount: bigint, currency: Currency }` where `amount` is the value in the currency's minor unit (e.g. cents, pence, öre) and `currency` is an ISO-4217 three-letter code. The system SHALL NOT use `number` for monetary amounts anywhere in the domain module.

#### Scenario: Adding two amounts of the same currency
- **WHEN** `addMoney({ amount: 100n, currency: "USD" }, { amount: 250n, currency: "USD" })` is called
- **THEN** the result is `{ amount: 350n, currency: "USD" }`

#### Scenario: Adding two amounts of different currencies
- **WHEN** `addMoney({ amount: 100n, currency: "USD" }, { amount: 100n, currency: "EUR" })` is called
- **THEN** the call throws a `DomainError` with code `CURRENCY_MISMATCH`

#### Scenario: Negating an amount
- **WHEN** `negateMoney({ amount: 500n, currency: "GBP" })` is called
- **THEN** the result is `{ amount: -500n, currency: "GBP" }`

### Requirement: IDs are branded and caller-provided

The system SHALL expose branded nominal types `WalletId`, `AccountId`, and `TransactionId` that are structurally strings but not assignable from an unbranded string at compile time. The reducer SHALL accept pre-generated IDs on action payloads and SHALL NOT generate IDs internally. The module SHALL provide a `newId<T extends string>(): T` helper that returns a branded UUID for callers that need one.

#### Scenario: Creating an account with a pre-generated id
- **WHEN** a caller generates `id = newId<AccountId>()` and dispatches `{ type: "account/add", accountId: id, name: "Checking", currency: "USD", openingBalance: { amount: 0n, currency: "USD" } }`
- **THEN** the resulting state contains an account whose `id` is exactly the provided value

#### Scenario: Dispatching with a duplicate account id
- **WHEN** two `account/add` actions are dispatched with the same `accountId`
- **THEN** the second dispatch throws a `DomainError` with code `DUPLICATE_ID`

### Requirement: A wallet is the single aggregate root

The system SHALL model domain state as either `null` (no wallet yet) or a single `Wallet` object containing `{ id: WalletId, name: string, accounts: Account[], transactions: Transaction[] }`. The reducer SHALL require `wallet/create` to be the first action dispatched against `null` state.

#### Scenario: Creating a wallet from null state
- **WHEN** `walletReducer(null, { type: "wallet/create", id, name: "Personal" })` is called
- **THEN** the result is a `Wallet` with the given `id`, name `"Personal"`, empty `accounts`, and empty `transactions`

#### Scenario: Dispatching a non-create action against null state
- **WHEN** `walletReducer(null, { type: "account/add", ... })` is called
- **THEN** the call throws a `DomainError` with code `NO_WALLET`

#### Scenario: Dispatching wallet/create against an existing wallet
- **WHEN** `walletReducer(existingWallet, { type: "wallet/create", ... })` is called
- **THEN** the call throws a `DomainError` with code `WALLET_ALREADY_EXISTS`

### Requirement: Accounts have a fixed currency and an archive flag

The system SHALL model each `Account` as `{ id: AccountId, name: string, currency: Currency, archived: boolean, openingBalance: Money, createdAt: string }`. Once set, `currency` SHALL NOT change. Archiving an account SHALL set `archived = true` but SHALL NOT remove the account or its transactions from state.

#### Scenario: Adding an account with an opening balance
- **WHEN** `account/add` is dispatched with `openingBalance: { amount: 10000n, currency: "USD" }` and matching `currency: "USD"`
- **THEN** the new account is stored with `archived: false` and the given opening balance

#### Scenario: Adding an account whose opening balance currency mismatches
- **WHEN** `account/add` is dispatched with `currency: "USD"` and `openingBalance: { amount: 0n, currency: "EUR" }`
- **THEN** the call throws a `DomainError` with code `CURRENCY_MISMATCH`

#### Scenario: Renaming an account
- **WHEN** `account/rename` is dispatched with `{ accountId, name: "Joint Checking" }` for an existing account
- **THEN** the account's name is updated and all other fields (including `currency`) are unchanged

#### Scenario: Archiving an account preserves its transactions
- **WHEN** an account with three posted transactions is archived via `account/archive`
- **THEN** the account's `archived` flag is `true` and all three transactions remain in the wallet's `transactions` list

### Requirement: Transactions are append-only and voidable

The system SHALL model each `Transaction` as `{ id: TransactionId, accountId: AccountId, amount: Money, occurredAt: string, memo?: string, voided: boolean }`. A posted transaction SHALL NOT be removed from state. "Deleting" a transaction SHALL be modeled as `transaction/void`, which flips `voided` to `true`. Voided transactions SHALL be excluded from balance calculations but SHALL remain in the `transactions` list.

#### Scenario: Posting a transaction to an open account
- **WHEN** `transaction/post` is dispatched with a valid `accountId`, a unique `transactionId`, and an `amount` whose currency matches the account
- **THEN** the transaction is appended to `wallet.transactions` with `voided: false`

#### Scenario: Posting a transaction whose currency mismatches the account
- **WHEN** `transaction/post` is dispatched for a USD account with `amount: { amount: 500n, currency: "EUR" }`
- **THEN** the call throws a `DomainError` with code `CURRENCY_MISMATCH`

#### Scenario: Posting a transaction to an archived account
- **WHEN** `transaction/post` targets an `accountId` whose `archived` flag is `true`
- **THEN** the call throws a `DomainError` with code `ACCOUNT_ARCHIVED`

#### Scenario: Posting a transaction to a nonexistent account
- **WHEN** `transaction/post` targets an `accountId` not present in `wallet.accounts`
- **THEN** the call throws a `DomainError` with code `UNKNOWN_ACCOUNT`

#### Scenario: Voiding a transaction
- **WHEN** `transaction/void` is dispatched for an existing non-voided transaction
- **THEN** that transaction's `voided` flag is `true` and it still appears in `wallet.transactions`

#### Scenario: Voiding an already-voided transaction
- **WHEN** `transaction/void` is dispatched for a transaction whose `voided` flag is already `true`
- **THEN** the call throws a `DomainError` with code `ALREADY_VOIDED`

#### Scenario: Voiding a nonexistent transaction
- **WHEN** `transaction/void` is dispatched with a `transactionId` not present in state
- **THEN** the call throws a `DomainError` with code `UNKNOWN_TRANSACTION`

### Requirement: Balances are derived, never stored

The system SHALL compute an account's current balance as the account's `openingBalance` plus the sum of all non-voided transactions targeting that account. The system SHALL NOT store a running balance on the `Account` record. A `balanceOfAccount(wallet, accountId)` selector SHALL return the computed `Money` value.

#### Scenario: Balance of a new account equals its opening balance
- **WHEN** an account is added with `openingBalance: { amount: 5000n, currency: "USD" }` and no transactions are posted
- **THEN** `balanceOfAccount(wallet, accountId)` returns `{ amount: 5000n, currency: "USD" }`

#### Scenario: Balance excludes voided transactions
- **WHEN** three transactions of `+100n` USD are posted to an account and one is voided
- **THEN** `balanceOfAccount(wallet, accountId)` reflects only the two non-voided transactions plus opening balance

#### Scenario: Balance of an unknown account
- **WHEN** `balanceOfAccount(wallet, unknownId)` is called
- **THEN** the call throws a `DomainError` with code `UNKNOWN_ACCOUNT`

### Requirement: Wallet totals aggregate balances by currency

The system SHALL provide a `walletTotals(wallet)` selector that returns a `Record<Currency, bigint>` summing each account's computed balance grouped by currency. Archived accounts SHALL still be included in the totals so the wallet's grand total is preserved.

#### Scenario: Totals across mixed currencies
- **WHEN** a wallet has a USD account with balance `+12000n` and an EUR account with balance `+3400n`
- **THEN** `walletTotals(wallet)` returns `{ USD: 12000n, EUR: 3400n }`

#### Scenario: Totals include archived accounts
- **WHEN** a wallet has an active USD account with balance `+500n` and an archived USD account with balance `+200n`
- **THEN** `walletTotals(wallet)` returns `{ USD: 700n }`

### Requirement: Domain errors are typed with stable codes

The system SHALL expose a `DomainError` class extending `Error` with a `code` field drawn from a fixed union: `"NO_WALLET" | "WALLET_ALREADY_EXISTS" | "UNKNOWN_ACCOUNT" | "DUPLICATE_ID" | "CURRENCY_MISMATCH" | "ACCOUNT_ARCHIVED" | "UNKNOWN_TRANSACTION" | "ALREADY_VOIDED"`. All invariant violations in the reducer and selectors SHALL throw `DomainError` (not plain `Error`).

#### Scenario: Catching an invariant violation by code
- **WHEN** a caller wraps a reducer dispatch in `try/catch` and the reducer throws
- **THEN** the caught error is an instance of `DomainError` with a `code` matching one of the listed string literals

### Requirement: The reducer is pure and deterministic

The system SHALL implement `walletReducer(state, action)` such that calling it with the same `state` and `action` always produces the same output, it does not mutate its inputs, and it performs no I/O (no `Date.now()`, no random IDs, no storage access). All non-deterministic values (IDs, timestamps) SHALL be supplied by the caller on the action payload.

#### Scenario: Reducer does not mutate the input state
- **WHEN** `walletReducer(state, action)` is called with any state and any action
- **THEN** the reference `state` is unchanged after the call (deep equal to its pre-call snapshot)

#### Scenario: Reducer output is a new reference on state change
- **WHEN** an action successfully changes state
- **THEN** the returned state is a different object reference from the input `state`

### Requirement: Domain module is React-free and dependency-free

The system SHALL keep the `src/domain/` module free of React, DOM, storage, or any runtime npm dependency beyond the TypeScript standard library. The module SHALL be importable from any context (Node, browser, web worker) without side effects.

#### Scenario: Importing the domain barrel has no side effects
- **WHEN** a consumer does `import * as domain from "./domain"` and does nothing else
- **THEN** no network, DOM, or storage access occurs during module evaluation

#### Scenario: Domain imports
- **WHEN** a reviewer inspects every file under `src/domain/`
- **THEN** no file contains an import from `react`, `react-dom`, `@vitejs/*`, or any path outside `src/domain/`
