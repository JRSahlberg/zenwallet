## ADDED Requirements

### Requirement: Accounts list stacks full-width on mobile viewports

The system SHALL, at viewport widths at or below 720px, render the accounts list (`AccountsList`) as a single column where each account card occupies the full content width. Card padding SHALL come from the shared spacing scale so that cards across pages share consistent internal spacing on mobile.

#### Scenario: Single-column list on mobile
- **WHEN** `/accounts` renders at a viewport width of 720px or narrower with at least two accounts
- **THEN** the account cards container (`.accounts-view__list` or equivalent) has a computed `grid-template-columns` resolving to one track, and every account card spans that single column

#### Scenario: Multi-column list on desktop
- **WHEN** `/accounts` renders at a viewport width of 1024px or wider with at least three accounts
- **THEN** the account cards container renders at least two columns

### Requirement: Net-worth header adapts to narrow viewports

The system SHALL, at viewport widths at or below 720px, render the net-worth header so that the eyebrow label `"Net worth"` sits on its own visual row above the per-currency total entries, and so that the per-currency entries wrap onto multiple lines as needed without introducing horizontal overflow of the header container.

#### Scenario: Eyebrow label stacks above entries on mobile
- **WHEN** the net-worth header renders at a viewport width of 720px or narrower
- **THEN** the `"Net worth"` label sits on a visual row above the first per-currency entry (not side-by-side with it)

#### Scenario: No horizontal overflow of the header on mobile
- **WHEN** the header renders at a viewport width of 360px with three or more per-currency totals
- **THEN** the header container's `scrollWidth` does not exceed its own `clientWidth` (entries wrap rather than overflow)

### Requirement: Account detail amounts are colored by sign

The system SHALL, inside `AccountDetail`'s recent-transaction list, apply sign-based color classes to each row's rendered amount matching the behavior specified for the transactions view: negative bigint amounts use a class resolving to `var(--negative)`, positive bigint amounts greater than `0n` use a class resolving to `var(--positive)`. The account's current balance heading SHALL remain neutral (`var(--text-strong)`) regardless of sign.

#### Scenario: Row amount is colored
- **WHEN** `AccountDetail` renders a non-voided transaction row whose amount has a non-zero bigint
- **THEN** the element containing the formatted row amount carries the matching positive or negative color class

#### Scenario: Balance heading is neutral
- **WHEN** the `AccountDetail` header renders the account's current balance
- **THEN** the element containing that balance does not carry a positive or negative color class, and its computed `color` resolves to `var(--text-strong)` (or inherits from it)
