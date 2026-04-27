# transaction-categories Specification

## Purpose
TBD - created by archiving change expand-wallet-ui. Update Purpose after archive.
## Requirements
### Requirement: A static category catalog is exposed from the feature layer

The system SHALL export two readonly tuples from `src/features/wallet/categories.ts`:

- `INCOME_CATEGORIES` containing at least `"Salary"`, `"Freelance"`, `"Transfer"`, `"Other"` (in that relative order).
- `EXPENSE_CATEGORIES` containing at least `"Food"`, `"Transport"`, `"Shopping"`, `"Bills"`, `"Travel"`, `"Health"`, `"Entertainment"`, `"Other"` (in that relative order).

The system SHALL also export a union type `Category` derived from the two tuples via `typeof INCOME_CATEGORIES[number] | typeof EXPENSE_CATEGORIES[number]`.

#### Scenario: Income categories are listed in order
- **WHEN** a caller imports `INCOME_CATEGORIES` and reads it as an array
- **THEN** the array contains the four listed labels in the specified relative order, with `"Other"` as the last income entry

#### Scenario: Expense categories are listed in order
- **WHEN** a caller imports `EXPENSE_CATEGORIES` and reads it as an array
- **THEN** the array contains the eight listed labels in the specified relative order, with `"Other"` as the last expense entry

#### Scenario: Category type narrows string
- **WHEN** a reviewer inspects `categories.ts`
- **THEN** the exported `Category` type resolves (via `typeof <tuple>[number]`) to the string-literal union of every entry in both tuples, and is not simply `string`

### Requirement: Categories module is pure and side-effect-free

The system SHALL implement `categories.ts` with only `as const` tuple literals and derived types. The module SHALL NOT import from React, the DOM, storage, the domain, or any path outside the file itself.

#### Scenario: No imports from other modules
- **WHEN** a reviewer inspects `src/features/wallet/categories.ts`
- **THEN** the file contains no `import` statements (or only pure `import type` from files that themselves have no runtime effects)

#### Scenario: No side effects at import time
- **WHEN** a consumer does `import { INCOME_CATEGORIES } from "./features/wallet/categories"` and does nothing else
- **THEN** no `console`, `window`, `document`, or storage calls occur during module evaluation

