## MODIFIED Requirements

### Requirement: Navigation lists top-level destinations from a single source

The system SHALL expose a typed `navDestinations` array in the routing module (`src/app/router.tsx`) of shape `{ to: string; label: string }[]`, and the `Navigation` component SHALL render one link per entry in that array. The system SHALL NOT maintain a separate list of nav items inside `Navigation` or any page component. The array SHALL contain exactly the following five entries, in this order: `{ to: '/', label: 'Home' }`, `{ to: '/wallet', label: 'Wallet' }`, `{ to: '/transactions', label: 'Transactions' }`, `{ to: '/accounts', label: 'Accounts' }`, `{ to: '/add', label: 'Add' }`. For every entry, a matching route SHALL be registered in the router config so the link resolves inside the `Layout`.

#### Scenario: Adding a destination updates the nav
- **WHEN** a developer adds a new entry `{ to: "/reports", label: "Reports" }` to `navDestinations` and a matching route to the router config
- **THEN** the rendered `<nav>` includes a link with text "Reports" pointing to `/reports` without any other code change

#### Scenario: Nav does not hardcode labels
- **WHEN** a reviewer inspects `Navigation.tsx`
- **THEN** its rendered links are produced by mapping over the imported `navDestinations` array, not by static JSX per destination

#### Scenario: Nav lists the five expected destinations
- **WHEN** a reviewer inspects the exported `navDestinations` array
- **THEN** the array has exactly five entries whose `label` values, in order, are `"Home"`, `"Wallet"`, `"Transactions"`, `"Accounts"`, `"Add"` and whose `to` values are `"/"`, `"/wallet"`, `"/transactions"`, `"/accounts"`, `"/add"`

#### Scenario: Every destination has a matching route
- **WHEN** a reviewer cross-checks `navDestinations` against the router config in the same file
- **THEN** every entry's `to` path resolves to a non-NotFound route whose element renders inside `Layout`
