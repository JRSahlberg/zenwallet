### Requirement: A feature-layer store provider hosts the wallet reducer

The system SHALL provide a `WalletStoreProvider` React component exported from `src/features/wallet/store.tsx` that internally calls `useReducer(walletReducer, null)` and exposes `{ state, dispatch }` via a typed React context. The system SHALL provide a `useWalletStore()` hook from the same module that returns `{ state, dispatch }` and throws an `Error` with a stable message when called outside the provider. The system SHALL mount exactly one `WalletStoreProvider` in `src/main.tsx` wrapping the `RouterProvider` so that every route sees the same store.

#### Scenario: Reading state inside the provider
- **WHEN** a component rendered inside `WalletStoreProvider` calls `useWalletStore()`
- **THEN** the hook returns an object with `state` (the current `DomainState`) and `dispatch` (a function of `Action`)

#### Scenario: Calling the hook outside the provider
- **WHEN** a component rendered outside any `WalletStoreProvider` calls `useWalletStore()`
- **THEN** the call throws an `Error` whose message contains `"useWalletStore"` and indicates the provider is missing

#### Scenario: Provider is mounted once in main.tsx
- **WHEN** a reviewer inspects `src/main.tsx`
- **THEN** the file imports `WalletStoreProvider` from `src/features/wallet/store` and wraps the single `<RouterProvider />` with it, with no other `WalletStoreProvider` usages elsewhere in `src/`

#### Scenario: Dispatch updates state for all subscribers
- **WHEN** one component inside the provider dispatches `{ type: "wallet/create", id, name: "Personal" }` against `null` state and another component in a different route reads `state` on the next render
- **THEN** both components observe the newly created `Wallet` as the current `state`

### Requirement: The `/wallet` route renders the wallet list view

The system SHALL render a `WalletView` component at path `/wallet` in `src/app/router.tsx`. The previous `/app` route entry SHALL be renamed to `/wallet` — the path string changes from `'app'` to `'wallet'` and its `element` becomes `<WalletView />`. The placeholder `<p>Coming soon</p>` element SHALL be removed, and no route with path `'app'` SHALL remain in the config. `WalletView` SHALL be imported from `src/features/wallet/WalletView` and SHALL render inside the existing `Layout` (i.e. inside `<main>`).

Correspondingly, the `navDestinations` array SHALL contain an entry `{ to: '/wallet', label: 'Wallet' }` in place of the existing `{ to: '/app', label: 'App' }` entry. The entry for `/` (the root) SHALL be unchanged.

#### Scenario: /wallet renders WalletView inside the shell
- **WHEN** a user navigates to `/wallet`
- **THEN** the page contains the shell's `<header>`, `<nav>`, `<footer>`, and a `<main>` whose content is produced by `WalletView`

#### Scenario: Placeholder is gone
- **WHEN** a reviewer inspects `src/app/router.tsx`
- **THEN** the `/wallet` route's `element` is `<WalletView />`, no route with path `'app'` appears in the file, and no `Coming soon` placeholder string appears anywhere in the file

#### Scenario: Navigation destination reflects the rename
- **WHEN** a reviewer inspects the exported `navDestinations` array
- **THEN** the array contains exactly one entry with `to: '/wallet'` whose `label` is `'Wallet'`, and contains no entry whose `to` is `'/app'` or whose `label` is `'App'`

#### Scenario: Nav active state works on the renamed route
- **WHEN** a user navigates to `/wallet`
- **THEN** the nav link whose `to` prop is `/wallet` has `aria-current="page"` and renders with the active visual style, while the root link does not

### Requirement: Empty state offers a demo-wallet seed action

The system SHALL detect when the store's `state` is `null` and render an empty state in `WalletView` containing an `<h1>` with text `"No wallet yet"` (case-insensitive match) and a `<button>` whose accessible name contains `"Create demo wallet"`. Clicking the button SHALL dispatch a deterministic sequence of actions built by a `buildDemoActions()` helper: one `wallet/create`, two `account/add` (one USD account, one EUR account), and at least two `transaction/post` actions including at least one later voided via `transaction/void`. Each action's ids SHALL be generated with `newId<...>()` at click time and each timestamp SHALL be set to `new Date().toISOString()` at click time.

#### Scenario: Empty state is shown when no wallet exists
- **WHEN** `WalletView` renders with store `state === null`
- **THEN** the rendered DOM contains an `<h1>` matching `"No wallet yet"` (case-insensitive) and a `<button>` whose accessible name contains `"Create demo wallet"`

#### Scenario: Clicking the seed button creates a wallet with two accounts
- **WHEN** a user clicks the "Create demo wallet" button from the empty state
- **THEN** after re-render the store `state` is a `Wallet` with exactly two accounts (one with `currency: "USD"`, one with `currency: "EUR"`) and at least two posted transactions, of which at least one has `voided: true`

#### Scenario: Ids and timestamps come from the feature layer, not the reducer
- **WHEN** a reviewer inspects `buildDemoActions` and the click handler that dispatches its output
- **THEN** every action payload carrying an id is populated by `newId<...>()` and every payload carrying a timestamp is populated by `new Date().toISOString()` in the feature layer, and the reducer is not modified to generate ids or timestamps

### Requirement: Populated view lists accounts with computed balances

The system SHALL, when store `state` is a non-null `Wallet`, render in `WalletView` a heading containing the wallet's `name` and a list (`<ul>` or `<table>`) with one row per entry in `state.accounts`. Each row SHALL display the account's `name`, its `currency`, a formatted balance produced by passing `balanceOfAccount(state, account.id)` through `formatMoney`, and a visual badge reading `"Archived"` (case-insensitive match) when `account.archived` is `true`. Archived accounts SHALL NOT be omitted from the list.

#### Scenario: Each account row shows its computed balance
- **WHEN** a wallet has an account `A` with `openingBalance: { amount: 10000n, currency: "USD" }` and two non-voided transactions of `+500n` USD posted to `A`
- **THEN** the row for `A` displays a balance formatted from `{ amount: 11000n, currency: "USD" }`

#### Scenario: Archived accounts are listed with a badge
- **WHEN** a wallet contains one active and one archived account
- **THEN** `WalletView` renders both rows, and the archived row contains a visually distinct element whose text matches `"archived"` (case-insensitive)

#### Scenario: Balances use the domain selector, not inline math
- **WHEN** a reviewer inspects `WalletView.tsx`
- **THEN** per-row balance values come from `balanceOfAccount` imported from `src/domain`, and no file under `src/features/wallet/` reimplements the balance formula (no loop summing `transactions` by `accountId` outside the domain)

### Requirement: Populated view shows per-currency totals

The system SHALL, when store `state` is a non-null `Wallet`, render a totals section in `WalletView` containing one entry per currency returned by `walletTotals(state)`. Each totals entry SHALL display the currency code and a formatted amount produced by passing `{ amount, currency }` through `formatMoney`. Archived accounts SHALL contribute to the totals.

#### Scenario: Totals entry per currency
- **WHEN** `walletTotals(state)` returns `{ USD: 12000n, EUR: 3400n }`
- **THEN** the totals section contains exactly two entries, one formatted for USD `12000n` and one formatted for EUR `3400n`, and no entry for any other currency

#### Scenario: Totals include archived accounts
- **WHEN** a wallet has an active USD account with balance `+500n` and an archived USD account with balance `+200n`
- **THEN** the totals section shows a single USD entry formatted from `{ amount: 700n, currency: "USD" }`

### Requirement: `formatMoney` renders minor-unit bigints without precision loss

The system SHALL provide a pure `formatMoney(money: Money, locale?: string): string` function exported from `src/features/wallet/formatMoney.ts`. The function SHALL look up the currency's minor-unit exponent from an internal map, convert the `bigint` minor-unit amount to an integer-and-fraction decimal string using `bigint` arithmetic only (no conversion of the full amount to `number`), and then use `Intl.NumberFormat(locale ?? "en-US", { style: "currency", currency: money.currency })` to produce the final string. For currencies not in the map, the function SHALL default to exponent `2` and emit a single `console.warn` per unknown currency per page load. The function SHALL be pure (no module-level state beyond the map and the warn-once set) and SHALL NOT import React, the DOM, storage, or the domain reducer.

#### Scenario: Formatting a known currency
- **WHEN** `formatMoney({ amount: 12345n, currency: "USD" })` is called
- **THEN** the returned string contains `"123.45"` (as a contiguous substring) and a `"$"` symbol, and does not contain `"NaN"` or the raw literal `"12345"`

#### Scenario: Zero-exponent currency
- **WHEN** `formatMoney({ amount: 10000n, currency: "JPY" })` is called
- **THEN** the returned string contains `"10,000"` (as a contiguous substring) and does not contain a decimal point

#### Scenario: Large amount does not lose precision
- **WHEN** `formatMoney({ amount: 12345678901234567890n, currency: "USD" })` is called
- **THEN** the returned string's digit content corresponds exactly to `123456789012345678.90`, proving no `Number(bigint)` conversion was applied to the full amount

#### Scenario: Unknown currency falls back and warns
- **WHEN** `formatMoney({ amount: 100n, currency: "XYZ" })` is called for the first time in a page session
- **THEN** the function returns a non-empty string computed with exponent `2` and `console.warn` has been invoked at least once; subsequent calls with the same `"XYZ"` currency do not produce additional warnings

### Requirement: Feature module is the single bridge between shell and domain

The system SHALL keep all imports of `src/domain/` from the UI confined to files under `src/features/`. No file under `src/app/` or `src/pages/` SHALL import from `src/domain/` or from `src/features/wallet/` other than `src/app/router.tsx` importing `WalletView` and `src/main.tsx` importing `WalletStoreProvider`. The feature module SHALL NOT import from `src/app/` or `src/pages/`.

#### Scenario: Shell does not import the feature module
- **WHEN** a reviewer greps every file under `src/app/` (except `router.tsx`) and every file under `src/pages/` for imports from `../features/` or `./features/` or `src/features/`
- **THEN** no matches are found

#### Scenario: Only router.tsx and main.tsx cross the boundary
- **WHEN** a reviewer lists every file outside `src/features/` that imports from `src/features/wallet/`
- **THEN** the list contains exactly `src/app/router.tsx` (importing `WalletView`) and `src/main.tsx` (importing `WalletStoreProvider`)

#### Scenario: Feature module does not import the shell
- **WHEN** a reviewer inspects every file under `src/features/wallet/`
- **THEN** no file imports from `../app/`, `../pages/`, `src/app/`, or `src/pages/`

### Requirement: Feature layer adds no runtime dependencies

The system SHALL implement the feature using only React 19, `react-router-dom` (already present), and the in-repo `src/domain/` module. The change SHALL NOT add any entries to `package.json`'s `dependencies` or `devDependencies`.

#### Scenario: package.json is unchanged except for intentional additions
- **WHEN** a reviewer runs `git diff main -- package.json package-lock.json` after implementation
- **THEN** no lines are added or removed in the `dependencies` or `devDependencies` sections
