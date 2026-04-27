## Why

ZenWallet currently boots to a static landing page and a single `/wallet` list view seeded from a demo button. To showcase the app as a usable personal-finance MVP, we need to let users actually *act* on their wallet — add transactions, browse them by account and category, and see meaningful summaries — and we need that state to survive a page refresh. This change turns the shell from a demo stub into the first real, multi-screen experience.

## What Changes

- **Persist wallet state to `localStorage`** automatically on every state change, and rehydrate on app startup. The demo wallet seed is shown only when no saved state exists.
- **Extend the domain transaction model** with two user-facing fields: `payee: string` (required, searchable) and `category: string` (chosen from a static catalog). Income vs. expense continues to be encoded as the sign of `amount`. **BREAKING** — existing `Transaction` records without these fields are invalid; demo seed is updated accordingly.
- **Add a static category catalog** exposed from the feature layer: income categories (Salary, Freelance, Transfer, Other) and expense categories (Food, Transport, Shopping, Bills, Travel, Health, Entertainment, Other).
- **Transform `/wallet` into a dashboard**: net-worth summary, current-month income total, current-month expense total, top spending category for the current month, account summary cards, and the 5 most recent transactions. The old empty-state + demo-seed behavior is preserved when no wallet exists.
- **New `/transactions` route** listing every posted transaction with filters by account, filters by category, full-text search over payee and memo, newest-first sort, and an explicit empty state when filters match nothing.
- **New `/accounts` route** with a net-worth header and account cards (name, currency, balance). Cards link to an account detail view showing the account's name, current balance, its 10 most recent transactions, and back navigation.
- **New `/add` route** with a transaction-entry form: type selector (income / expense), payee, amount, account, category, and optional note. Inline validation enforces required fields; on submit the transaction is posted, balances update, state persists, the form clears, and success feedback is shown.
- **Update top navigation** to: Home, Wallet, Transactions, Accounts, Add.

## Capabilities

### New Capabilities
- `wallet-persistence`: localStorage serialization of wallet state with bigint-safe encoding, automatic save on change, and rehydration on startup.
- `transactions-view`: the `/transactions` page — filtered, searchable, sorted transaction list with empty state.
- `accounts-view`: the `/accounts` list page and the `/accounts/:accountId` detail page, including net-worth header and recent-transactions list on detail.
- `add-transaction-view`: the `/add` page — income/expense form with validation, submit-clear-toast flow.
- `transaction-categories`: the static income/expense category catalog exposed as a typed constant from the feature layer.

### Modified Capabilities
- `wallet-domain`: `Transaction` gains required `payee: string` and required `category: string`; selectors are added for current-month totals (by sign) and top spending category (by absolute expense amount within month).
- `ui-shell`: `navDestinations` changes to five entries (Home, Wallet, Transactions, Accounts, Add) with matching routes registered in `router.tsx`.
- `wallet-list-view`: `/wallet` becomes a dashboard — the plain account list is replaced by summary cards, month totals, top-category card, account summary cards, and a recent-transactions panel. Empty-state + demo-seed behavior is preserved.

## Impact

- **Code:** new `src/features/wallet/persistence.ts`, `categories.ts`; new pages under `src/pages/` for Transactions, Accounts (list + detail), Add; new feature components for dashboard widgets; extensions to `src/domain/types.ts`, `src/domain/reducer.ts` validation, and `src/domain/selectors.ts` for month-scoped aggregations. `src/app/router.tsx` grows three new routes + one nested detail route; `navDestinations` expands to five entries.
- **Data:** persisted shape adds `payee` and `category` on `Transaction`. No migration path — any older localStorage payload is dropped and the demo wallet is re-seeded.
- **Dependencies:** no new runtime dependencies. React Router v7 and React 19 already cover forms, navigation, and state needs.
- **Testing:** still no test runner wired up; correctness is gated by `tsc -b` and `eslint`, plus manual dev-server verification of each new route.
