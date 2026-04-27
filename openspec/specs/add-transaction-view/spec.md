# add-transaction-view Specification

## Purpose
TBD - created by archiving change expand-wallet-ui. Update Purpose after archive.
## Requirements
### Requirement: The `/add` route renders the add-transaction form

The system SHALL register a `/add` route in `src/app/router.tsx` whose `element` is `<AddPage />` (from `src/pages/Add.tsx`) that renders a `<AddTransactionForm />` from `src/features/wallet/AddTransactionForm.tsx`. The route SHALL render inside the existing `Layout`, and `navDestinations` SHALL include `{ to: '/add', label: 'Add' }`.

#### Scenario: /add renders the form inside the shell
- **WHEN** a user navigates to `/add`
- **THEN** the rendered DOM contains the shell's `<header>`, `<nav>`, `<footer>`, and a `<main>` whose content includes a `<form>` produced by `AddTransactionForm`

#### Scenario: Form is unreachable as the demo seed point
- **WHEN** the store `state` is `null` and a user navigates to `/add`
- **THEN** the form renders a guidance message pointing the user to `/wallet` to create a wallet first, and the submit button is disabled (so no dispatch can fire against `null` state)

### Requirement: The form exposes a transaction-type selector that controls amount sign

The system SHALL render a control (radio group or segmented selector) to choose between `"Income"` and `"Expense"`. The selector SHALL default to `"Expense"`. The chosen type SHALL determine the sign of the posted amount: `"Income"` posts a positive amount, `"Expense"` posts a negative amount. The chosen type SHALL also narrow the category dropdown's options: `"Income"` exposes `INCOME_CATEGORIES`, `"Expense"` exposes `EXPENSE_CATEGORIES`.

#### Scenario: Default type is Expense
- **WHEN** the form is first rendered
- **THEN** the type control has `"Expense"` selected and the category dropdown lists the `EXPENSE_CATEGORIES` entries

#### Scenario: Switching to Income changes the category options
- **WHEN** the user switches the type to `"Income"`
- **THEN** the category dropdown lists the `INCOME_CATEGORIES` entries and no expense-only category remains selectable

#### Scenario: Posted amount sign reflects the type
- **WHEN** the user submits with type `"Expense"`, amount `"12.34"`, and a USD account selected
- **THEN** the dispatched `transaction/post` payload carries `amount: { amount: -1234n, currency: "USD" }`

#### Scenario: Income posts a positive amount
- **WHEN** the user submits with type `"Income"`, amount `"50.00"`, and a USD account selected
- **THEN** the dispatched `transaction/post` payload carries `amount: { amount: 5000n, currency: "USD" }`

### Requirement: Required fields are validated inline before submit

The system SHALL treat the following fields as required: type (always defaulted), payee, amount, account, category. The form SHALL block submission and render inline validation errors next to any missing or invalid field. Errors SHALL be human-readable (non-empty strings) and cleared automatically when the field becomes valid.

#### Scenario: Empty payee is blocked
- **WHEN** the user clicks submit with payee blank and all other required fields valid
- **THEN** no `transaction/post` is dispatched, the form stays on screen, and an inline error is rendered adjacent to the payee input whose text is non-empty

#### Scenario: Missing account is blocked
- **WHEN** the user clicks submit without selecting an account
- **THEN** no dispatch fires and an inline error is rendered adjacent to the account select whose text is non-empty

#### Scenario: Invalid amount string is blocked
- **WHEN** the user types `"abc"` or `"1.2345"` (more fractional digits than the account currency's exponent allows) into the amount input and clicks submit
- **THEN** no dispatch fires and an inline error is rendered adjacent to the amount input; the error mentions the amount being invalid

#### Scenario: Errors clear as fields become valid
- **WHEN** an inline error is visible on a field and the user edits the field to a valid value
- **THEN** the inline error for that field is removed from the DOM without requiring another submit click

### Requirement: Submitting a valid form posts the transaction and clears the form

The system SHALL, on valid submit, generate `newId<TransactionId>()` and `new Date().toISOString()` in the feature layer, dispatch `{ type: 'transaction/post', ... }` with the chosen account, signed amount, payee, category, and optional memo, reset all inputs to their initial values, and render a transient success message whose text matches `"transaction added"` (case-insensitive). The success message SHALL be automatically cleared after a short delay (≤ 3 seconds) or on the next keystroke.

#### Scenario: Successful submit dispatches transaction/post
- **WHEN** the user submits with valid fields (type Expense, payee "Acme", amount "5.00", account A/USD, category "Food", memo "lunch")
- **THEN** exactly one `transaction/post` action is dispatched whose payload has `amount: { amount: -500n, currency: "USD" }`, `accountId: A`, `payee: "Acme"`, `category: "Food"`, `memo: "lunch"`, a freshly-generated `transactionId`, and an `occurredAt` equal to the click-time ISO string

#### Scenario: Form clears after successful submit
- **WHEN** a submit succeeds
- **THEN** all input values (payee, amount, memo) are reset to empty, account and category are reset to their default unselected state (or "select…" placeholder), and the type selector resets to `"Expense"`

#### Scenario: Success feedback is displayed
- **WHEN** a submit succeeds
- **THEN** the DOM renders a status element whose text matches `"transaction added"` (case-insensitive) and which is removed within 3 seconds or on the user's next interaction

### Requirement: The form uses shared domain and feature utilities

The system SHALL construct action payloads using `newId` from `src/domain/ids`, dispatch via `useWalletStore`, format example balances (if shown for preview) via `formatMoney`, and parse user-entered decimal strings to bigint minor units via a pure helper in `src/features/wallet/parseMoneyInput.ts`. The form SHALL NOT reimplement minor-unit conversion inline and SHALL NOT call the reducer directly.

#### Scenario: Amount parsing goes through the shared helper
- **WHEN** a reviewer inspects `AddTransactionForm.tsx`
- **THEN** the decimal-to-bigint-minor-units conversion is performed by calling `parseMoneyInput` (or an equivalent exported helper), and no `Number(...)` or `parseFloat(...)` call is applied to the full-precision amount

#### Scenario: Dispatch uses the feature-layer store hook
- **WHEN** a reviewer inspects `AddTransactionForm.tsx`
- **THEN** the dispatch call comes from `useWalletStore()` and the module does not import `walletReducer` directly

