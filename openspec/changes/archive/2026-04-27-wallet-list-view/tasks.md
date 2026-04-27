## 1. Scaffold the feature module

- [x] 1.1 Create the directory `src/features/wallet/` (alongside `src/app/`, `src/pages/`, `src/domain/`).
- [x] 1.2 Create `src/features/wallet/formatMoney.ts` exporting a pure `formatMoney(money, locale?)` helper: an internal `CURRENCY_EXPONENT` map (start with `USD`, `EUR`, `GBP`, `JPY`, `SEK`), a `warnedCurrencies` `Set<string>` for the warn-once behavior, `bigint`-only conversion from minor units to integer/fraction parts, and final formatting via `Intl.NumberFormat(locale ?? "en-US", { style: "currency", currency })`. No React, DOM, or domain imports.
- [x] 1.3 Create `src/features/wallet/seedDemoWallet.ts` exporting `buildDemoActions(): Action[]` that returns one `wallet/create`, two `account/add` (one USD "Checking", one EUR "Travel"), at least two `transaction/post` actions, and at least one `transaction/void` referencing one of the posted transactions. Use `newId<WalletId>()`, `newId<AccountId>()`, `newId<TransactionId>()` from `src/domain` and `new Date().toISOString()` at call time. Import types (`Action`, `WalletId`, `AccountId`, `TransactionId`) from `src/domain`.
- [x] 1.4 Create `src/features/wallet/store.tsx` exporting `WalletStoreProvider` (a component wrapping children in a context whose value is `{ state, dispatch }` from `useReducer(walletReducer, null)`) and `useWalletStore()` (reads the context and throws `new Error("useWalletStore must be called inside WalletStoreProvider")` if the context is the sentinel default). Use a non-null sentinel (e.g. `const SENTINEL = Symbol()`) so the hook can detect "outside provider" reliably.

## 2. Build the page component

- [x] 2.1 Create `src/features/wallet/WalletView.tsx`. Import `useWalletStore` from `./store`, `balanceOfAccount` and `walletTotals` from `src/domain`, `formatMoney` from `./formatMoney`, and `buildDemoActions` from `./seedDemoWallet`.
- [x] 2.2 Implement the empty-state branch: when `state === null`, render a section containing `<h1>No wallet yet</h1>`, a short paragraph of intro copy, and a `<button type="button">Create demo wallet</button>` whose `onClick` iterates `buildDemoActions()` and calls `dispatch` for each action in order.
- [x] 2.3 Implement the populated branch: when `state !== null`, render the wallet's name as a heading, a `<ul>` (or `<table>`) listing `state.accounts` — each row shows `account.name`, `account.currency`, `formatMoney(balanceOfAccount(state, account.id))`, and a `<span class="archived-badge">Archived</span>` when `account.archived` is true — and a totals section iterating `Object.entries(walletTotals(state))` and rendering `formatMoney({ amount, currency })` per currency.
- [x] 2.4 Create `src/features/wallet/WalletView.css` with minimal styling for the list, totals, and archived badge. Import it at the top of `WalletView.tsx`.

## 3. Wire the store into main.tsx

- [x] 3.1 In `src/main.tsx`, import `WalletStoreProvider` from `./features/wallet/store` and wrap the existing `<RouterProvider router={router} />` with `<WalletStoreProvider>...</WalletStoreProvider>`. Keep `<StrictMode>` as the outermost wrapper if it is already there.
- [x] 3.2 Confirm that `src/main.tsx` has no other `WalletStoreProvider` usages and no direct `useReducer(walletReducer, ...)` call (the provider owns that).

## 4. Rename /app → /wallet and wire WalletView

- [x] 4.1 In `src/app/router.tsx`, import `WalletView` from `../features/wallet/WalletView` and replace the existing `{ path: 'app', element: <p>Coming soon</p> }` entry with `{ path: 'wallet', element: <WalletView /> }`. Leave the `/` route, the `*` route, the `errorElement`, and the layout wrapper untouched.
- [x] 4.2 In the same file, update the `navDestinations` entry from `{ to: '/app', label: 'App' }` to `{ to: '/wallet', label: 'Wallet' }`. Leave the `{ to: '/', label: 'Home' }` entry unchanged.
- [x] 4.3 Verify by inspection that no new import from `src/domain/` was added to any file in `src/app/` or `src/pages/`.

## 5. Verification

- [x] 5.1 Run `npm run lint` and fix any lint errors introduced by the new files.
- [x] 5.2 Run `npm run build` and confirm `tsc -b` passes against both `tsconfig.app.json` and `tsconfig.node.json`.
- [x] 5.3 Run `npm run dev` and manually exercise: load `/wallet` → see empty state → click "Create demo wallet" → see two account rows with correct balances, an "Archived" badge on any archived seed row, and a totals section with one USD entry and one EUR entry. Navigate to `/` and back to `/wallet` → state is preserved (same wallet still shown). Confirm the nav entry now reads `"Wallet"` and carries `aria-current="page"` when `/wallet` is the active route.
- [x] 5.4 Manually verify that `/app` now renders the NotFound page (the old path is no longer routed), and that `/this-route-does-not-exist` also still shows the NotFound page inside the shell (i.e. the router change did not regress the existing `ui-shell` behavior).
- [x] 5.5 Run `git diff package.json package-lock.json` and confirm both files are unchanged.

## 6. Cross-check against specs

- [x] 6.1 Walk through every scenario in `openspec/changes/wallet-list-view/specs/wallet-list-view/spec.md` and confirm manually (via the running dev server and/or source inspection) that each one passes. Specifically verify the "Formatting a known currency", "Zero-exponent currency", "Large amount does not lose precision", and "Unknown currency falls back and warns" scenarios by calling `formatMoney` from a scratch console or a temporary test page — then remove the scratch code before committing.
- [x] 6.2 Walk through the unchanged-boundary scenarios: `grep -r "from.*domain" src/app src/pages` returns nothing, `grep -r "from.*features" src/app src/pages` matches only `src/app/router.tsx`.
