## 1. Domain extensions

- [x] 1.1 Extend `Transaction` in `src/domain/types.ts` with required `payee: string` and required `category: string`
- [x] 1.2 Add `MISSING_PAYEE` and `MISSING_CATEGORY` to the `DomainError` code union in `src/domain/errors.ts`
- [x] 1.3 Update `transaction/post` in `src/domain/reducer.ts` to reject empty or whitespace-only `payee` / `category` with the new codes
- [x] 1.4 Implement `monthlyTotals(wallet, start, endExclusive)` in `src/domain/selectors.ts` (per-currency income/expense aggregation, time-free)
- [x] 1.5 Implement `topSpendingCategory(wallet, start, endExclusive, currency)` in `src/domain/selectors.ts` with lexicographic tiebreak and `null` on no expenses
- [x] 1.6 Re-export the new selectors and error codes from `src/domain/index.ts`
- [x] 1.7 Update `src/features/wallet/seedDemoWallet.ts` so every seeded transaction supplies `payee` and `category`

## 2. Persistence module

- [x] 2.1 Create `src/features/wallet/persistence.ts` with the bigint-safe JSON codec (`serialize`/`deserialize` using `{ $bigint: "…" }`)
- [x] 2.2 Add an envelope `{ v: 1, state }` and a `STORAGE_KEY` constant (e.g. `"zenwallet:v1"`)
- [x] 2.3 Implement `loadWalletState(): DomainState` — try/catch on read, JSON parse, version check, shape validation (reject transactions missing `payee`/`category`); return `null` on any failure with a single `console.warn`
- [x] 2.4 Implement `saveWalletState(state): void` — try/catch on write
- [x] 2.5 Update `src/features/wallet/store.tsx` to initialize `useReducer(walletReducer, loadWalletState())` and call `saveWalletState(state)` from a `useEffect` on every state change

## 3. Category catalog and money parser

- [x] 3.1 Create `src/features/wallet/categories.ts` exporting `INCOME_CATEGORIES` and `EXPENSE_CATEGORIES` as `as const` tuples and a derived `Category` union type, with no imports
- [x] 3.2 Create `src/features/wallet/parseMoneyInput.ts` — pure bigint-only decimal-to-minor-units parser taking a string plus a currency exponent, returning either `{ ok: true, amount: bigint }` or `{ ok: false, reason: string }`

## 4. Dashboard (populated `/wallet`)

- [x] 4.1 Add a small helper in `src/features/wallet/` (e.g. `monthWindow.ts`) that returns `{ start, endExclusive }` ISO strings for the current local month using `new Date()` at call time
- [x] 4.2 Build `NetWorthCard`, `MonthTotalsCard`, `TopCategoryCard`, `AccountSummaryList`, `RecentTransactionsPanel` as presentational components under `src/features/wallet/dashboard/`
- [x] 4.3 Replace the populated branch of `WalletView` with a dashboard layout composed of the new cards/panels; preserve the `state === null` empty-state + "Create demo wallet" button unchanged
- [x] 4.4 Verify the dashboard uses `walletTotals`, `balanceOfAccount`, `monthlyTotals`, and `topSpendingCategory` exclusively for numeric output — no inline summing of `state.transactions`

## 5. Transactions page

- [x] 5.1 Create `src/features/wallet/TransactionsView.tsx` rendering the filtered, searchable, newest-first transaction list
- [x] 5.2 Implement the account filter (`<select>`), category filter (`<select>`), and text search input as local `useState`
- [x] 5.3 Implement the filter/search/sort pipeline over `state.transactions` (exclude voided, sort desc by `occurredAt`, then apply filters) as a pure function inside the component
- [x] 5.4 Render distinct empty states: "no transactions yet" for empty/null wallet, "no matches" when filters exclude everything
- [x] 5.5 Create `src/pages/Transactions.tsx` as the thin page wrapper that renders `<TransactionsView />`

## 6. Accounts pages

- [x] 6.1 Create `src/pages/Accounts.tsx` rendering the net-worth header plus an `<Outlet />`
- [x] 6.2 Create `src/features/wallet/AccountsList.tsx` rendering one card per account (name, currency, balance, archived badge), each wrapped in a `Link` to `/accounts/:accountId`
- [x] 6.3 Create `src/features/wallet/AccountDetail.tsx` — read `:accountId` via `useParams`, render the name, formatted balance, up to 10 newest non-voided transactions, and a back link to `/accounts`
- [x] 6.4 Add an in-page "account not found" branch for unknown `:accountId` or `state === null`

## 7. Add-transaction page

- [x] 7.1 Create `src/features/wallet/AddTransactionForm.tsx` with controlled inputs for type (radio / segmented), payee (text), amount (text), account (select), category (select — options driven by type), memo (text, optional)
- [x] 7.2 Implement inline validation per field with a local errors object; clear an error as soon as its field becomes valid
- [x] 7.3 On valid submit: compute `amount.amount = sign * parseMoneyInput(…)`, generate `newId<TransactionId>()`, set `occurredAt = new Date().toISOString()`, dispatch `transaction/post`, reset inputs, show a transient success message (clear ≤ 3s or on next keystroke)
- [x] 7.4 Disable the submit button when `state === null` and render a guidance message pointing to `/wallet`
- [x] 7.5 Create `src/pages/Add.tsx` as the thin page wrapper that renders `<AddTransactionForm />`

## 8. Router and navigation

- [x] 8.1 Update `navDestinations` in `src/app/router.tsx` to the five entries: Home, Wallet, Transactions, Accounts, Add (in that order)
- [x] 8.2 Register the matching routes inside the existing `Layout` child list: `transactions` → `<Transactions />`, nested `accounts` (index `<AccountsList />` via `<Accounts />` parent, `:accountId` → `<AccountDetail />`), `add` → `<Add />`
- [x] 8.3 Confirm the `*` catch-all still resolves to `NotFound` and all new routes render inside the shell

## 9. Layer-boundary and cleanup checks

- [x] 9.1 Grep `src/domain/` for any `react`, `react-dom`, `localStorage`, `sessionStorage`, or `Date.now`/`new Date` call — ensure none exist (selectors accept caller-provided time windows)
- [x] 9.2 Grep `src/app/` (except `router.tsx`) and `src/pages/` for any import from `../features/` or `../domain/` — ensure none exist; page modules only import their feature component
- [x] 9.3 Grep `src/` for `localStorage`/`sessionStorage`/`indexedDB` — matches must appear only in `src/features/wallet/persistence.ts` and `src/features/wallet/store.tsx`
- [x] 9.4 Remove any old assumption that `/wallet` renders a plain account list (comments, dead code) from `src/features/wallet/`

## 10. Verification

- [x] 10.1 `npm run lint` passes with no new warnings
- [x] 10.2 `npm run build` (i.e. `tsc -b && vite build`) passes on both project references
- [x] 10.3 Manually walk through `npm run dev`: create demo wallet → navigate all five nav links → add one income and one expense via `/add` → refresh browser and confirm state persists → delete localStorage key and confirm the demo empty state returns
- [x] 10.4 Manually verify on a narrow viewport (≤ 420 px wide) that the dashboard, accounts, and transactions layouts remain readable and do not horizontally scroll
