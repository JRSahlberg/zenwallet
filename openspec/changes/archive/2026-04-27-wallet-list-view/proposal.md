## Why

The `/app` route currently renders a placeholder ("Coming soon") under the nav label `"App"`, and the `wallet-domain` module, while fully implemented, has no UI consumer. Users cannot see their wallet, its accounts, or per-account balances. This change introduces the first real feature view so ZenWallet has a usable surface, and establishes the pattern for how future feature views bridge the presentational shell (`ui-shell`) and the pure domain (`wallet-domain`) without coupling them. It also renames the placeholder route to match what lives there.

## What Changes

- Add a `WalletView` page rendered at `/wallet` that displays the active wallet's accounts with each account's computed balance and shows per-currency wallet totals.
- When no wallet exists yet (`null` state), render an empty state with a primary action to create a demo wallet seeded with two accounts (one USD, one EUR) and a couple of sample transactions, so the list has something meaningful to show.
- Introduce a feature layer at `src/features/wallet/` that is allowed to import from `src/domain/`. The UI shell (`src/app/`, `src/pages/`) remains domain-free.
- Introduce a typed React context (`WalletStoreProvider` + `useWalletStore` hook) that owns a `useReducer(walletReducer, null)` and exposes `{ state, dispatch }`. The provider is mounted once, above the router outlet but inside the feature boundary (not inside `Layout`).
- Rename the existing placeholder route: in `src/app/router.tsx`, change the `/app` entry to `/wallet` and its `element` to `<WalletView />`. Update `navDestinations` so the entry becomes `{ to: '/wallet', label: 'Wallet' }`.
- Currency formatting uses a small pure helper (`formatMoney`) in the feature layer — no new runtime dependencies. `bigint` minor units are rendered as decimal strings with the correct exponent per ISO 4217 (hardcoded for the currencies the domain supports).

Non-goals: no forms for adding/editing accounts or transactions, no persistence, no routing to per-account detail pages. Those are follow-up changes.

## Capabilities

### New Capabilities
- `wallet-list-view`: a feature view that renders the active wallet's accounts with their computed balances and per-currency totals, including an empty state that seeds a demo wallet, and the minimal store wiring (context + reducer) needed to host domain state in the React tree.

### Modified Capabilities
<!-- None: ui-shell's "domain-free shell" requirement still holds because the new code lives in src/features/, not src/app/ or src/pages/. wallet-domain is unchanged. -->

## Impact

- Affected code: `src/app/router.tsx` (rename `/app` → `/wallet`, swap the element to `<WalletView />`, relabel the nav entry to `Wallet`), new `src/features/wallet/` module (`WalletStoreProvider`, `useWalletStore`, `WalletView`, `formatMoney`, a small CSS file), and `src/main.tsx` (wrap the `RouterProvider` with `WalletStoreProvider` so all routes share one store).
- Affected specs: new `wallet-list-view` capability spec. No deltas to `ui-shell` or `wallet-domain`.
- Dependencies: none added. Uses existing React 19, react-router-dom, and the in-repo domain module.
- Testing: no test runner is configured in the repo; verification is manual via `npm run dev` plus `npm run build` / `npm run lint`. If a runner is introduced later, the scenarios in the new spec are the acceptance checklist.
