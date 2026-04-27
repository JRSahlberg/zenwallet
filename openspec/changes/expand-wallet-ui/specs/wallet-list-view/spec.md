## MODIFIED Requirements

### Requirement: A feature-layer store provider hosts the wallet reducer

The system SHALL provide a `WalletStoreProvider` React component exported from `src/features/wallet/store.tsx` that internally calls `useReducer(walletReducer, loadWalletState())` — using the loader exported from `src/features/wallet/persistence.ts` — and exposes `{ state, dispatch }` via a typed React context. The system SHALL provide a `useWalletStore()` hook from the same module that returns `{ state, dispatch }` and throws an `Error` with a stable message when called outside the provider. The provider SHALL subscribe via `useEffect` to its own `state` and call `saveWalletState(state)` on every change. The system SHALL mount exactly one `WalletStoreProvider` in `src/main.tsx` wrapping the `RouterProvider` so that every route sees the same store.

#### Scenario: Reading state inside the provider
- **WHEN** a component rendered inside `WalletStoreProvider` calls `useWalletStore()`
- **THEN** the hook returns an object with `state` (the current `DomainState`) and `dispatch` (a function of `Action`)

#### Scenario: Calling the hook outside the provider
- **WHEN** a component rendered outside any `WalletStoreProvider` calls `useWalletStore()`
- **THEN** the call throws an `Error` whose message contains `"useWalletStore"` and indicates the provider is missing

#### Scenario: Provider is mounted once in main.tsx
- **WHEN** a reviewer inspects `src/main.tsx`
- **THEN** the file imports `WalletStoreProvider` from `src/features/wallet/store` and wraps the single `<RouterProvider />` with it, with no other `WalletStoreProvider` usages elsewhere in `src/`

#### Scenario: Initial state comes from the persistence loader
- **WHEN** a reviewer inspects `src/features/wallet/store.tsx`
- **THEN** the `useReducer` call passes the result of `loadWalletState()` (or an equivalent imported loader from `./persistence`) as its initial state, and does not hard-code `null`

#### Scenario: State is saved on every change
- **WHEN** the provider's internal state changes from one dispatch to another
- **THEN** an effect fires that calls `saveWalletState(state)` imported from `./persistence` with the post-change state

#### Scenario: Dispatch updates state for all subscribers
- **WHEN** one component inside the provider dispatches `{ type: "wallet/create", id, name: "Personal" }` against `null` state and another component in a different route reads `state` on the next render
- **THEN** both components observe the newly created `Wallet` as the current `state`

### Requirement: Populated view lists accounts with computed balances

The system SHALL, when store `state` is a non-null `Wallet`, render `WalletView` as a dashboard whose populated body contains the following panels in a visually grouped layout: (1) a "Net worth" summary showing one formatted entry per currency returned by `walletTotals(state)`; (2) a "This month" panel showing the current-month income total and expense total per currency, computed via `monthlyTotals(state, monthStart, monthEnd)` where the window is `[first day of current month, first day of next month)` in the user's local timezone; (3) a "Top spending" panel showing the category returned by `topSpendingCategory(state, monthStart, monthEnd, <primary currency>)` with its formatted total, or a fallback message when the selector returns `null`; (4) an "Accounts" summary that renders one condensed card per entry in `state.accounts` with the account's `name`, `currency`, formatted balance from `balanceOfAccount`, and an `"archived"`-matching badge when archived; (5) a "Recent transactions" panel listing up to the 5 most recent non-voided transactions newest-first by `occurredAt`, each showing payee, category, account name, and formatted amount. Balances and totals SHALL come from the named domain selectors, never from inline math.

#### Scenario: Net-worth panel renders per-currency entries
- **WHEN** `walletTotals(state)` returns `{ USD: 12000n, EUR: 3400n }`
- **THEN** the "Net worth" panel renders exactly two formatted entries (USD `12000n` and EUR `3400n`), and no entry for any other currency

#### Scenario: Month totals reflect the current month only
- **WHEN** the current month's window contains one non-voided USD income of `+10000n` and one non-voided USD expense of `-3000n`, with additional transactions outside the window
- **THEN** the "This month" panel shows, for USD, an income entry formatted from `+10000n` and an expense entry formatted from `3000n`, and no contribution from out-of-window transactions

#### Scenario: Top spending panel shows the leading category
- **WHEN** `topSpendingCategory` returns `{ category: "Food", total: 3500n }` for the primary currency
- **THEN** the "Top spending" panel renders the label `"Food"` and a formatted amount from `{ amount: 3500n, currency: <primary> }`

#### Scenario: Top spending panel shows a fallback when no expenses
- **WHEN** `topSpendingCategory` returns `null` for the primary currency
- **THEN** the "Top spending" panel renders a placeholder message (e.g. containing `"no expenses"` case-insensitive) and does not render a broken value

#### Scenario: Accounts summary lists all accounts including archived
- **WHEN** a wallet has one active and one archived account
- **THEN** the "Accounts" summary renders two cards, each with the account's formatted balance from `balanceOfAccount`, and the archived card contains a visible element whose text matches `"archived"` case-insensitively

#### Scenario: Recent transactions panel is capped at five
- **WHEN** a wallet has 12 non-voided transactions
- **THEN** the "Recent transactions" panel renders exactly 5 rows, those being the 5 transactions with the latest `occurredAt`, newest first

#### Scenario: Recent transactions exclude voided rows
- **WHEN** a wallet has 3 non-voided and 10 voided transactions
- **THEN** the recent panel renders at most 3 rows (the non-voided ones), and none of the voided rows appear

#### Scenario: Dashboard relies on domain selectors, not inline math
- **WHEN** a reviewer inspects `WalletView.tsx` and any dashboard subcomponent under `src/features/wallet/`
- **THEN** balances come from `balanceOfAccount`, per-currency totals from `walletTotals`, month totals from `monthlyTotals`, and top category from `topSpendingCategory`; no file under `src/features/wallet/` reimplements these formulas (no loops summing `transactions` by `accountId`, sign, or category outside the domain)

### Requirement: Populated view shows per-currency totals

The system SHALL render per-currency totals as part of the dashboard's "Net worth" panel described in the populated-view dashboard requirement. Each entry SHALL display the currency code and a formatted amount produced by passing `{ amount, currency }` through `formatMoney`, where `amount` comes from `walletTotals(state)`. Archived accounts SHALL contribute to the totals.

#### Scenario: Totals entry per currency
- **WHEN** `walletTotals(state)` returns `{ USD: 12000n, EUR: 3400n }`
- **THEN** the "Net worth" panel contains exactly two entries, one formatted for USD `12000n` and one formatted for EUR `3400n`, and no entry for any other currency

#### Scenario: Totals include archived accounts
- **WHEN** a wallet has an active USD account with balance `+500n` and an archived USD account with balance `+200n`
- **THEN** the "Net worth" panel shows a single USD entry formatted from `{ amount: 700n, currency: "USD" }`
