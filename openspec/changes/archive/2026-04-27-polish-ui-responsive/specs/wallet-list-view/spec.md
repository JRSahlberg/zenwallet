## ADDED Requirements

### Requirement: Dashboard cards stack full width on mobile viewports

The system SHALL, at viewport widths at or below 720px, render the wallet dashboard's card grid as a single column with each card occupying the full content width. Card internal padding SHALL be consistent across cards on mobile (derived from the shared spacing scale, not per-card ad-hoc values).

#### Scenario: Single-column grid on mobile
- **WHEN** `/wallet` is rendered at a viewport width of 720px or narrower with store `state` populated
- **THEN** the card grid container (`.wallet-view__grid` or equivalent) has a computed `grid-template-columns` resolving to one track, and every `.dashboard-card` spans the full width of that grid

#### Scenario: Desktop grid remains multi-column
- **WHEN** `/wallet` is rendered at a viewport width of 1024px or wider with store `state` populated and at least three cards present
- **THEN** the card grid container renders at least two columns

### Requirement: Dashboard recent-transaction rows collapse to a two-row block on mobile

The system SHALL, inside any recent-transaction list rendered on `/wallet`, at viewport widths at or below 720px, render each row as a two-row block where the first row contains the payee (or label) on the left and the amount on the right, and the second row contains the category, account name (when shown), and date joined as a single visual line (e.g. separated by a middle dot, pipe, or comma). Each row SHALL remain a single list item with its original children — only the visual layout changes.

#### Scenario: Two-row block below the breakpoint
- **WHEN** the wallet dashboard's recent-transactions card renders at a viewport width of 720px or narrower
- **THEN** each row's computed layout places the amount on the same visual line as the payee and places the row's other metadata on a second visual line beneath

#### Scenario: Desktop layout unchanged
- **WHEN** the same list renders at a viewport width of 1024px or wider
- **THEN** each row renders as a single line with payee, category, account, date, and amount on the same row (matching the current desktop layout)

### Requirement: Amounts in the wallet dashboard are colored by sign

The system SHALL, for every monetary amount rendered inside the wallet dashboard's recent-transaction rows and month-to-date summary, apply a color class reflecting the sign: negative amounts SHALL use a class that resolves to `var(--negative)`, positive amounts SHALL use a class that resolves to `var(--positive)`, and neutral balances (account balances, totals) SHALL use `var(--text-strong)`. The sign SHALL remain present in the rendered text via `formatMoney` output (color is additive, not a replacement).

#### Scenario: Negative transaction amount is colored
- **WHEN** the recent-transactions card renders a transaction whose amount has a negative `bigint`
- **THEN** the element containing that amount carries a class whose computed `color` resolves to `var(--negative)` and its text still begins with a `"-"` produced by `formatMoney`

#### Scenario: Positive transaction amount is colored
- **WHEN** the recent-transactions card renders a transaction whose amount has a non-negative `bigint` greater than `0n`
- **THEN** the element containing that amount carries a class whose computed `color` resolves to `var(--positive)`

#### Scenario: Balances are neutral
- **WHEN** an account-balance row renders inside a dashboard card
- **THEN** the element containing the balance does not carry the positive or negative color class, and its computed `color` resolves to `var(--text-strong)` (or inherits from it)
