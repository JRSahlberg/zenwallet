## ADDED Requirements

### Requirement: The `/accounts` route renders the accounts list

The system SHALL register a nested `/accounts` route in `src/app/router.tsx` whose parent element is `<AccountsPage />` (from `src/pages/Accounts.tsx`) containing an `<Outlet />`, with an index child rendering `<AccountsList />` (from `src/features/wallet/AccountsList.tsx`) and a `:accountId` child rendering `<AccountDetail />` (from `src/features/wallet/AccountDetail.tsx`). The `navDestinations` array SHALL include `{ to: '/accounts', label: 'Accounts' }`.

#### Scenario: /accounts renders the list inside the shell
- **WHEN** a user navigates to `/accounts`
- **THEN** the rendered DOM contains the shell's `<header>`, `<nav>`, `<footer>`, and a `<main>` whose content is produced by `AccountsPage` with `AccountsList` rendered at the outlet

#### Scenario: Nav active state works on /accounts
- **WHEN** a user navigates to `/accounts` or any `/accounts/:id`
- **THEN** the nav link with `to='/accounts'` has `aria-current="page"` (or the router's equivalent partial-match active state) and the active visual style

### Requirement: The accounts page renders a net-worth header above the list

The system SHALL render, when store `state` is a non-null `Wallet`, a header section inside `AccountsPage` (above the `<Outlet />`) containing a "Net worth" label and one entry per currency returned by `walletTotals(state)`. Each entry SHALL display the currency code and a formatted amount produced by `formatMoney`. Archived accounts SHALL contribute to the totals.

#### Scenario: Net-worth header renders one entry per currency
- **WHEN** `walletTotals(state)` returns `{ USD: 5000n, EUR: 2500n }`
- **THEN** the header renders exactly two formatted entries (one USD, one EUR), each using `formatMoney`, and no entry for any other currency

#### Scenario: Header is visible from both list and detail
- **WHEN** a user navigates between `/accounts` and `/accounts/:accountId`
- **THEN** the net-worth header remains mounted and visible at the top of `<main>` across both routes

### Requirement: The accounts list renders one card per account

The system SHALL render, inside `AccountsList`, one card per entry in `state.accounts` (including archived accounts). Each card SHALL display the account's `name`, its `currency`, and its current balance (produced by `balanceOfAccount(state, account.id)` passed through `formatMoney`). Archived accounts SHALL be marked with a visible badge whose text matches `"archived"` (case-insensitive). Each card SHALL be a link (or contain a link) to `/accounts/:accountId` where `:accountId` is that account's id.

#### Scenario: Each card shows name, currency, and balance
- **WHEN** a wallet contains two accounts
- **THEN** two cards render, each containing the account's `name`, its `currency`, and a balance formatted by `formatMoney` from the domain selector output

#### Scenario: Archived accounts show a badge
- **WHEN** an account has `archived: true`
- **THEN** its card renders a visible element whose text matches `"archived"` case-insensitively

#### Scenario: Clicking a card navigates to detail
- **WHEN** a user activates (click / keyboard) the link portion of an account card with id `X`
- **THEN** the router transitions to `/accounts/X` and `AccountDetail` renders

### Requirement: The account detail view shows balance and recent transactions

The system SHALL render, inside `AccountDetail` when the `:accountId` param resolves to an existing account, a heading with the account name, a formatted current balance (`balanceOfAccount` → `formatMoney`), and a list of up to 10 most recent non-voided transactions on that account, newest first by `occurredAt`. Each transaction row SHALL show payee, category, date, and amount (via `formatMoney`). The view SHALL include a back-navigation link (e.g. "Back to accounts") pointing to `/accounts`.

#### Scenario: Header shows name and balance
- **WHEN** an account `A` has `openingBalance: { amount: 10000n, currency: "USD" }` and one `+5000n` USD non-voided transaction
- **THEN** `/accounts/A` renders a heading containing the account's name and a balance formatted from `{ amount: 15000n, currency: "USD" }`

#### Scenario: Recent list is capped at 10
- **WHEN** an account has 14 non-voided transactions
- **THEN** the recent-transactions list renders exactly 10 rows, those being the 10 transactions with the latest `occurredAt`

#### Scenario: Recent list excludes voided transactions
- **WHEN** an account has 3 non-voided and 5 voided transactions
- **THEN** the recent list renders at most 3 rows (the non-voided ones), newest first

#### Scenario: Back link points to /accounts
- **WHEN** the detail view is rendered
- **THEN** the DOM contains a link whose accessible name contains `"back"` (case-insensitive) and whose `href` resolves to `/accounts`

### Requirement: Unknown account id renders a not-found state

The system SHALL render, when the `:accountId` param does not match any account in `state.accounts` (including the `state === null` case), an in-page not-found block containing a heading whose text matches `"account not found"` (case-insensitive) and a link back to `/accounts`.

#### Scenario: Unknown id renders the not-found block
- **WHEN** a user navigates to `/accounts/does-not-exist`
- **THEN** the view renders an in-page not-found block with the matching heading and a link to `/accounts`, and the shell chrome remains visible

#### Scenario: State is null
- **WHEN** the store `state` is `null` and a user navigates to `/accounts/anything`
- **THEN** the view renders the account not-found block (the demo seed lives on `/wallet`; detail pages do not seed)
