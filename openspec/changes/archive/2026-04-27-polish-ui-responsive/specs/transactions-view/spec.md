## ADDED Requirements

### Requirement: Transaction rows collapse to a two-row block on mobile viewports

The system SHALL, at viewport widths at or below 720px, render each row in `TransactionsView` as a two-row block where the first visual row contains the payee on the left and the amount on the right (aligned to the trailing edge), and the second visual row contains the category, account name, and formatted date joined as a single meta line (e.g. separated by middle dots). Row semantics (each row remains one `<li>` or `<tr>`) SHALL be preserved.

#### Scenario: Two-row block below the breakpoint
- **WHEN** `/transactions` renders at a viewport width of 720px or narrower with at least one non-voided transaction
- **THEN** within each row element, the payee and the amount share the topmost visual line, and the category / account / date appear together on the line directly below

#### Scenario: Desktop layout unchanged
- **WHEN** `/transactions` renders at a viewport width of 1024px or wider
- **THEN** each row renders as a single line with payee, category, account, date, and amount on the same visual row (matching the current desktop layout)

### Requirement: Filters stack full-width on mobile viewports

The system SHALL, at viewport widths at or below 720px, render the `TransactionsView` filter controls (account select, category select, search input) as a stacked column where each control occupies the full content width. Labels SHALL remain associated with their controls (implicit `<label>` wrapping or explicit `for`/`id`), and the stacked controls SHALL remain keyboard-focusable in visual order.

#### Scenario: Filters stack on mobile
- **WHEN** `/transactions` renders at a viewport width of 720px or narrower
- **THEN** each filter control (and its label) occupies the full width of the filter region and the controls appear in a single vertical column

#### Scenario: Filters are horizontal on desktop
- **WHEN** `/transactions` renders at a viewport width of 1024px or wider
- **THEN** the filter controls appear on one or more horizontal rows with multiple controls per row (the current desktop `flex-wrap` layout)

### Requirement: Transaction amounts are colored by sign

The system SHALL, for every amount rendered in `TransactionsView` rows, apply a color class reflecting the transaction's amount sign: negative bigint amounts use a class resolving to `var(--negative)`, positive bigint amounts greater than `0n` use a class resolving to `var(--positive)`, and exact-zero amounts (if any) use `var(--text-strong)`. The `formatMoney` output SHALL remain the text source (no inline sign manipulation by the view).

#### Scenario: Negative row amount is colored
- **WHEN** a row renders a transaction whose `amount.amount` is a negative `bigint`
- **THEN** the element containing the formatted amount carries a class whose computed `color` resolves to `var(--negative)`

#### Scenario: Positive row amount is colored
- **WHEN** a row renders a transaction whose `amount.amount` is a `bigint` greater than `0n`
- **THEN** the element containing the formatted amount carries a class whose computed `color` resolves to `var(--positive)`
