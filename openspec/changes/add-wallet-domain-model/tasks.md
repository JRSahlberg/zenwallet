## 1. Scaffolding

- [x] 1.1 Create the `src/domain/` directory with empty files: `index.ts`, `money.ts`, `ids.ts`, `types.ts`, `reducer.ts`, `selectors.ts`, `errors.ts`
- [x] 1.2 Confirm `tsconfig.app.json` already covers `src/domain/**/*.ts` (no changes needed); note in the PR body that no tsconfig changes were required

## 2. Errors

- [x] 2.1 In `errors.ts`, define the `DomainErrorCode` string-literal union: `"NO_WALLET" | "WALLET_ALREADY_EXISTS" | "UNKNOWN_ACCOUNT" | "DUPLICATE_ID" | "CURRENCY_MISMATCH" | "ACCOUNT_ARCHIVED" | "UNKNOWN_TRANSACTION" | "ALREADY_VOIDED"`
- [x] 2.2 Export a `DomainError` class extending `Error` with a readonly `code: DomainErrorCode` field, a constructor that sets `name = "DomainError"`, and nothing else

## 3. IDs

- [x] 3.1 In `ids.ts`, define branded types `WalletId`, `AccountId`, `TransactionId` using `string & { readonly __brand: "WalletId" | ... }`
- [x] 3.2 Export `newId<T extends string>(): T` that returns `crypto.randomUUID() as T`; this is the only impure helper and lives outside the reducer

## 4. Money

- [x] 4.1 In `money.ts`, define `type Currency = string` constrained by a small `SupportedCurrency` union (`"USD" | "EUR" | "GBP" | "SEK" | "JPY"` as the initial set; extend later as needed) and `type Money = { amount: bigint; currency: Currency }`
- [x] 4.2 Implement `sameCurrency(a: Money, b: Money): boolean`
- [x] 4.3 Implement `addMoney(a: Money, b: Money): Money` that throws `DomainError("CURRENCY_MISMATCH")` on mismatch
- [x] 4.4 Implement `negateMoney(m: Money): Money`
- [x] 4.5 Implement `zeroMoney(currency: Currency): Money` (convenience for opening balances)

## 5. Types

- [x] 5.1 In `types.ts`, define `Account = { id: AccountId; name: string; currency: Currency; archived: boolean; openingBalance: Money; createdAt: string }`
- [x] 5.2 Define `Transaction = { id: TransactionId; accountId: AccountId; amount: Money; occurredAt: string; memo?: string; voided: boolean }`
- [x] 5.3 Define `Wallet = { id: WalletId; name: string; accounts: readonly Account[]; transactions: readonly Transaction[] }`
- [x] 5.4 Define `DomainState = Wallet | null` and export it

## 6. Reducer

- [x] 6.1 In `reducer.ts`, define the `Action` discriminated union covering `wallet/create`, `account/add`, `account/rename`, `account/archive`, `transaction/post`, `transaction/void` exactly as specified in design.md §6
- [x] 6.2 Implement `walletReducer(state: DomainState, action: Action): DomainState` using a `switch` on `action.type` with an exhaustiveness check (`never`-typed default branch)
- [x] 6.3 Implement the `wallet/create` handler: reject if state is not null (`WALLET_ALREADY_EXISTS`); otherwise return a fresh `Wallet`
- [x] 6.4 For every other action type, throw `NO_WALLET` if state is null before reading it
- [x] 6.5 Implement `account/add`: reject duplicate `accountId` (`DUPLICATE_ID`), reject currency mismatch between account currency and opening balance (`CURRENCY_MISMATCH`), append to `wallet.accounts`
- [x] 6.6 Implement `account/rename`: reject unknown `accountId` (`UNKNOWN_ACCOUNT`), return new wallet with the renamed account (other fields unchanged)
- [x] 6.7 Implement `account/archive`: reject unknown `accountId` (`UNKNOWN_ACCOUNT`), flip `archived` to true, leave transactions intact
- [x] 6.8 Implement `transaction/post`: reject unknown account (`UNKNOWN_ACCOUNT`), archived account (`ACCOUNT_ARCHIVED`), currency mismatch (`CURRENCY_MISMATCH`), duplicate `transactionId` (`DUPLICATE_ID`); append with `voided: false`
- [x] 6.9 Implement `transaction/void`: reject unknown `transactionId` (`UNKNOWN_TRANSACTION`), reject already-voided (`ALREADY_VOIDED`), flip `voided` to true in place (immutably)
- [x] 6.10 Verify the reducer never calls `Date.now()`, `Math.random()`, `crypto.*`, or any storage API (self-review + grep); timestamps and IDs come from the action payload

## 7. Selectors

- [x] 7.1 In `selectors.ts`, implement `balanceOfAccount(wallet: Wallet, accountId: AccountId): Money` by folding opening balance + non-voided transactions with matching `accountId`; throw `UNKNOWN_ACCOUNT` if missing
- [x] 7.2 Implement `transactionsForAccount(wallet: Wallet, accountId: AccountId): readonly Transaction[]` (returns voided rows too; callers filter if they want to)
- [x] 7.3 Implement `walletTotals(wallet: Wallet): Record<Currency, bigint>` summing `balanceOfAccount` across every account (archived included), grouped by currency

## 8. Barrel + final checks

- [x] 8.1 In `index.ts`, re-export the public API: types (`Wallet`, `Account`, `Transaction`, `Money`, `Currency`, `WalletId`, `AccountId`, `TransactionId`, `DomainState`, `Action`, `DomainErrorCode`), values (`walletReducer`, `newId`, `addMoney`, `negateMoney`, `zeroMoney`, `sameCurrency`, `balanceOfAccount`, `transactionsForAccount`, `walletTotals`, `DomainError`)
- [x] 8.2 Confirm no file under `src/domain/` imports from `react`, `react-dom`, or any path outside `src/domain/` (grep)
- [x] 8.3 Run `npm run build` and confirm `tsc -b` passes with no errors or unused-locals warnings
- [x] 8.4 Run `npm run lint` and fix any violations in the new files
- [x] 8.5 Confirm `npm run dev` still boots the unchanged starter page (sanity check that we did not accidentally touch `App.tsx` or `main.tsx`)
