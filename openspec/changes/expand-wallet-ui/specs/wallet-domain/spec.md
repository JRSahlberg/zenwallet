## MODIFIED Requirements

### Requirement: Transactions are append-only and voidable

The system SHALL model each `Transaction` as `{ id: TransactionId, accountId: AccountId, amount: Money, occurredAt: string, payee: string, category: string, memo?: string, voided: boolean }`. The `payee` field SHALL be a non-empty string identifying who the money is paid to or received from; the `category` field SHALL be a non-empty string drawn from a caller-supplied catalog (the domain does not constrain the set of legal category strings). A posted transaction SHALL NOT be removed from state. "Deleting" a transaction SHALL be modeled as `transaction/void`, which flips `voided` to `true`. Voided transactions SHALL be excluded from balance calculations but SHALL remain in the `transactions` list.

#### Scenario: Posting a transaction to an open account
- **WHEN** `transaction/post` is dispatched with a valid `accountId`, a unique `transactionId`, an `amount` whose currency matches the account, a non-empty `payee`, and a non-empty `category`
- **THEN** the transaction is appended to `wallet.transactions` with `voided: false` and with the supplied `payee` and `category` preserved verbatim

#### Scenario: Posting a transaction whose currency mismatches the account
- **WHEN** `transaction/post` is dispatched for a USD account with `amount: { amount: 500n, currency: "EUR" }` (other fields valid)
- **THEN** the call throws a `DomainError` with code `CURRENCY_MISMATCH`

#### Scenario: Posting a transaction to an archived account
- **WHEN** `transaction/post` targets an `accountId` whose `archived` flag is `true` (other fields valid)
- **THEN** the call throws a `DomainError` with code `ACCOUNT_ARCHIVED`

#### Scenario: Posting a transaction to a nonexistent account
- **WHEN** `transaction/post` targets an `accountId` not present in `wallet.accounts` (other fields valid)
- **THEN** the call throws a `DomainError` with code `UNKNOWN_ACCOUNT`

#### Scenario: Posting a transaction with an empty payee
- **WHEN** `transaction/post` is dispatched with `payee: ""` (or a whitespace-only string)
- **THEN** the call throws a `DomainError` with code `MISSING_PAYEE`

#### Scenario: Posting a transaction with an empty category
- **WHEN** `transaction/post` is dispatched with `category: ""` (or a whitespace-only string)
- **THEN** the call throws a `DomainError` with code `MISSING_CATEGORY`

#### Scenario: Voiding a transaction
- **WHEN** `transaction/void` is dispatched for an existing non-voided transaction
- **THEN** that transaction's `voided` flag is `true` and it still appears in `wallet.transactions`

#### Scenario: Voiding an already-voided transaction
- **WHEN** `transaction/void` is dispatched for a transaction whose `voided` flag is already `true`
- **THEN** the call throws a `DomainError` with code `ALREADY_VOIDED`

#### Scenario: Voiding a nonexistent transaction
- **WHEN** `transaction/void` is dispatched with a `transactionId` not present in state
- **THEN** the call throws a `DomainError` with code `UNKNOWN_TRANSACTION`

### Requirement: Domain errors are typed with stable codes

The system SHALL expose a `DomainError` class extending `Error` with a `code` field drawn from a fixed union: `"NO_WALLET" | "WALLET_ALREADY_EXISTS" | "UNKNOWN_ACCOUNT" | "DUPLICATE_ID" | "CURRENCY_MISMATCH" | "ACCOUNT_ARCHIVED" | "UNKNOWN_TRANSACTION" | "ALREADY_VOIDED" | "MISSING_PAYEE" | "MISSING_CATEGORY"`. All invariant violations in the reducer and selectors SHALL throw `DomainError` (not plain `Error`).

#### Scenario: Catching an invariant violation by code
- **WHEN** a caller wraps a reducer dispatch in `try/catch` and the reducer throws
- **THEN** the caught error is an instance of `DomainError` with a `code` matching one of the listed string literals

#### Scenario: Missing-field codes are reachable
- **WHEN** a caller dispatches `transaction/post` with `payee: ""` and, separately, with `category: ""`
- **THEN** the first call throws `DomainError` with `code: "MISSING_PAYEE"` and the second throws with `code: "MISSING_CATEGORY"`

## ADDED Requirements

### Requirement: Monthly totals are derived within a caller-provided window

The system SHALL expose a pure selector `monthlyTotals(wallet: Wallet, start: string, endExclusive: string): { currency: Currency, income: bigint, expense: bigint }[]`. The selector SHALL return one entry per currency for which the wallet has at least one non-voided transaction `t` with `start <= t.occurredAt < endExclusive`. For each such currency, `income` SHALL be the sum of positive `amount.amount` values and `expense` SHALL be the sum of the absolute values of negative `amount.amount` values within the window. The selector SHALL accept ISO-8601 string bounds and SHALL NOT call `Date.now()` or `new Date()` internally.

#### Scenario: Totals include only transactions in the window
- **WHEN** a USD account has non-voided transactions at `2026-03-15T00:00:00Z` (+10000n), `2026-03-20T00:00:00Z` (-3000n), and `2026-04-02T00:00:00Z` (+5000n), and the caller asks for `start="2026-03-01T00:00:00Z"` / `endExclusive="2026-04-01T00:00:00Z"`
- **THEN** the returned array contains exactly one entry `{ currency: "USD", income: 10000n, expense: 3000n }`, and the April transaction is not included

#### Scenario: Voided transactions are excluded
- **WHEN** the only in-window transaction for a currency has `voided: true`
- **THEN** that currency does not appear in the returned array

#### Scenario: Multi-currency windows
- **WHEN** the window contains one USD income of `+200n` and one EUR expense of `-50n`, both non-voided
- **THEN** the returned array has two entries: one for USD with `income: 200n, expense: 0n` and one for EUR with `income: 0n, expense: 50n`

#### Scenario: Selector is time-free
- **WHEN** a reviewer inspects `src/domain/selectors.ts`
- **THEN** `monthlyTotals` contains no call to `Date.now`, `new Date`, `performance.now`, or any equivalent clock access

### Requirement: Top spending category is derived within a caller-provided window

The system SHALL expose a pure selector `topSpendingCategory(wallet: Wallet, start: string, endExclusive: string, currency: Currency): { category: string, total: bigint } | null`. The selector SHALL consider only non-voided transactions with `t.amount.currency === currency` and `start <= t.occurredAt < endExclusive` whose `amount.amount` is negative (expenses). Among those, it SHALL group by `category` and return the entry with the largest absolute sum. When two categories tie, the selector SHALL return the one whose lexicographically earliest `category` string sorts first. When no matching transactions exist, the selector SHALL return `null`.

#### Scenario: Single top category
- **WHEN** the in-window USD expenses are three `"Food"` (`-1000n`, `-2000n`, `-500n`) and two `"Bills"` (`-800n`, `-400n`)
- **THEN** `topSpendingCategory` returns `{ category: "Food", total: 3500n }`

#### Scenario: No expenses in window returns null
- **WHEN** the wallet has only income in the window (or no transactions in the window at all)
- **THEN** `topSpendingCategory` returns `null`

#### Scenario: Ties are broken lexicographically
- **WHEN** `"Food"` and `"Bills"` are tied at `-1000n` each in the window
- **THEN** `topSpendingCategory` returns the entry whose `category` is `"Bills"` (lexicographically first)

#### Scenario: Selector ignores other currencies
- **WHEN** the caller requests `currency: "USD"` and there is a large `-10000n` EUR expense in the window
- **THEN** that EUR expense does not contribute to the returned total
