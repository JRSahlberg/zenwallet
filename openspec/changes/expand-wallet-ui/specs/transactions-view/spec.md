## ADDED Requirements

### Requirement: The `/transactions` route renders the transactions view

The system SHALL register a `/transactions` route in `src/app/router.tsx` whose `element` is a `<TransactionsPage />` (from `src/pages/Transactions.tsx`) that renders a `<TransactionsView />` from `src/features/wallet/TransactionsView.tsx`. The route SHALL render inside the existing `Layout`, and its link SHALL appear in `navDestinations` as `{ to: '/transactions', label: 'Transactions' }`.

#### Scenario: /transactions renders inside the shell
- **WHEN** a user navigates to `/transactions`
- **THEN** the rendered DOM contains the shell's `<header>`, `<nav>`, `<footer>`, and a `<main>` whose content is produced by `TransactionsView`

#### Scenario: Nav active state works on /transactions
- **WHEN** a user navigates to `/transactions`
- **THEN** the nav link with `to='/transactions'` has `aria-current="page"` and the active visual style, and no other nav link carries the active state

### Requirement: The view lists every non-voided transaction newest-first

The system SHALL, when store `state` is a non-null `Wallet` with at least one non-voided transaction, render a list (`<ul>` or `<table>`) where each row corresponds to one non-voided `Transaction`. Rows SHALL be ordered by `occurredAt` descending (newest first). Each row SHALL display the transaction's `payee`, its `category`, its account name (resolved from `accountId`), its `occurredAt` formatted as a human-readable date, and its `amount` formatted via `formatMoney`.

#### Scenario: Rows appear newest first
- **WHEN** three non-voided transactions exist with `occurredAt` values `2026-01-01T00:00:00Z`, `2026-03-01T00:00:00Z`, and `2026-02-01T00:00:00Z`
- **THEN** the rendered rows appear in the order March, February, January (top to bottom)

#### Scenario: Voided transactions are excluded
- **WHEN** a wallet has four transactions of which one has `voided: true`
- **THEN** the rendered list contains exactly three rows and the voided transaction is not present

#### Scenario: Amount formatting uses formatMoney
- **WHEN** a reviewer inspects `TransactionsView.tsx`
- **THEN** every rendered amount comes from `formatMoney` imported from `../formatMoney`, and no row reimplements the minor-unit-to-decimal conversion

### Requirement: The view supports filtering by account

The system SHALL render an account filter control (a `<select>` or equivalent) whose options are an "All accounts" default plus one option per account in the wallet. When an account is selected, the list SHALL be restricted to rows whose `accountId` matches the selection. Archived accounts SHALL still appear as selectable options.

#### Scenario: Selecting an account narrows the list
- **WHEN** a user selects a specific account from the filter and the wallet has transactions across multiple accounts
- **THEN** every rendered row's `accountId` equals the selected account id, and rows belonging to other accounts are hidden

#### Scenario: "All accounts" restores the full list
- **WHEN** a user had selected a specific account and then switches back to the "All accounts" option
- **THEN** the rendered list again contains every non-voided transaction in newest-first order

### Requirement: The view supports filtering by category

The system SHALL render a category filter control whose options are an "All categories" default plus one option per category string present in the wallet's non-voided transactions. Selecting a category SHALL restrict the list to rows whose `category` equals the selection (string equality).

#### Scenario: Selecting a category narrows the list
- **WHEN** a user selects the category `"Food"` and the wallet has three `"Food"` transactions and four transactions with other categories
- **THEN** exactly three rows are rendered, each with `category === "Food"`

#### Scenario: Category filter combines with account filter
- **WHEN** a user sets the account filter to account `A` and the category filter to `"Bills"`
- **THEN** every rendered row has both `accountId === A` and `category === "Bills"`; rows matching only one condition are hidden

### Requirement: The view supports text search over payee and memo

The system SHALL render a text input for search. When the search input is non-empty, the list SHALL be restricted to rows whose `payee` or `memo` contains the search string as a case-insensitive substring. When the input is empty, no search filter SHALL be applied.

#### Scenario: Search matches payee
- **WHEN** the search input contains `"amazon"` and three transactions have `payee` values `"Amazon Fresh"`, `"Amzn"`, and `"Whole Foods"`
- **THEN** only the row whose payee is `"Amazon Fresh"` is visible (case-insensitive substring match); the other two are hidden

#### Scenario: Search matches memo
- **WHEN** the search input contains `"refund"` and one transaction has `memo === "Return refund"` while others have no matching memo
- **THEN** the single matching row is visible; rows without a memo or without the substring are hidden

#### Scenario: Empty search is ignored
- **WHEN** the search input is empty (or whitespace-only)
- **THEN** the displayed rows are determined only by the account and category filters, not the search input

### Requirement: The view shows an empty state when no rows match

The system SHALL render an empty-state block containing an accessible message (e.g. a heading or paragraph whose text matches `"no transactions"` case-insensitively) in three cases: the wallet has no non-voided transactions, the wallet is `null`, or the current filters produce no matches. The message SHALL be distinguishable between "no data yet" and "no matches" at a minimum by including the word `"match"` in the filter-empty variant.

#### Scenario: Empty state when the wallet has no transactions
- **WHEN** the store `state` is a non-null `Wallet` with an empty `transactions` list
- **THEN** the view renders the "no transactions" empty state and no row elements are rendered

#### Scenario: Empty state when filters exclude everything
- **WHEN** a wallet has transactions but the combined account, category, and search filters produce zero matches
- **THEN** the view renders an empty-state message whose text matches `"no"` and `"match"` (case-insensitive), and no row elements are rendered

#### Scenario: Empty state when state is null
- **WHEN** the store `state` is `null`
- **THEN** the view renders the "no transactions" empty state (or redirects to `/wallet` for the demo seed — implementation choice) and no row elements are rendered
