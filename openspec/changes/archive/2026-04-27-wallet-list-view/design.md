## Context

ZenWallet today ships a `ui-shell` (Layout, Navigation, Landing, NotFound, router) and a fully implemented `wallet-domain` (reducer, selectors, money, ids, errors), but no code wires them together. The shell spec forbids `src/app/` and `src/pages/` from importing `src/domain/`, performing I/O, or holding domain state in hooks — the shell is presentational only. The domain spec, for its part, forbids React imports — the domain is pure. This leaves a gap: there is no agreed-upon layer where `useReducer(walletReducer, null)` lives, no place that is allowed to call `balanceOfAccount` and render the result.

This change fills that gap with a minimal, single-feature answer. We are not introducing a redux-style store, a query layer, or routing-scoped loaders. We are introducing one React context provider that owns a `useReducer`, one page component that reads it, and the routing rewrite that renames `/app` to `/wallet` and renders that page there.

Constraints inherited from the existing specs:
- Shell stays domain-free (`ui-shell` scenario: "Shell imports" — no `src/domain/` imports under `src/app/` or `src/pages/`).
- Domain stays React-free and dependency-free (`wallet-domain` scenario: "Domain imports" — no `react` imports under `src/domain/`).
- Reducer is pure: callers supply ids and timestamps, not the reducer.
- Money is `bigint` minor units; never `number`.

## Goals / Non-Goals

**Goals:**
- Render the active wallet's accounts with per-account balances and per-currency totals at `/wallet` (renamed from the existing `/app` placeholder route).
- Provide an empty-state CTA that seeds a demo wallet so a fresh install shows non-trivial content.
- Introduce a feature layer (`src/features/wallet/`) that is explicitly permitted to import from `src/domain/`, and establish it as the pattern for future feature views.
- Keep the shell and domain specs intact — no deltas to either.
- Render monetary amounts correctly from `bigint` minor units (no floating-point conversion).

**Non-Goals:**
- Forms to add/rename/archive accounts or to post/void transactions. Those will each be their own changes against the new `wallet-list-view` capability or successor capabilities.
- Persistence (localStorage, IndexedDB, server sync). The store is in-memory for this change; refreshing the page resets state.
- A per-account detail route. The list view links nowhere (or links are inert placeholders) in this change.
- Internationalization of number formatting beyond respecting ISO-4217 minor-unit exponents. We use `Intl.NumberFormat` with a fixed locale (`en-US`) for now.
- Editing state from URL params, optimistic updates, or undo/redo.

## Decisions

### D1. State lives in a React Context backed by `useReducer`, mounted above the router
**Decision:** Create `WalletStoreProvider` that calls `useReducer(walletReducer, null)` and exposes `{ state, dispatch }` via a typed context. Mount it once in `src/main.tsx` wrapping `<RouterProvider router={router} />`. Consumers use a `useWalletStore()` hook that throws if called outside the provider.

**Why:** It is the smallest thing that works. The domain already gives us a pure reducer and a `DomainState = Wallet | null` type; `useReducer` is the React-idiomatic way to host it. Mounting the provider above the router (not inside `Layout`) means (a) the shell components stay domain-free — `Layout` does not have to know the store exists — and (b) every route under the router can read/write the same wallet. A throwing `useWalletStore` hook replaces boilerplate null-checks with a single fail-fast guard.

**Alternatives considered:**
- *Redux / Zustand / Jotai.* Rejected: adds a dependency for a single reducer we already have. Reconsider when we need selector memoization, middleware, or persistence.
- *Mount the provider inside `Layout`.* Rejected: `Layout` lives in `src/app/` and is required by the `ui-shell` spec to be domain-free. The provider imports `walletReducer` from the domain.
- *Route loaders (react-router `loader`/`action`).* Rejected: loaders are designed around async fetching and URL-driven data, not local reducer state. They would push us toward revalidation logic we do not need yet.

### D2. A new `src/features/wallet/` module is the bridge layer
**Decision:** Create `src/features/wallet/` with `store.tsx` (provider + hook), `WalletView.tsx` (the page), `formatMoney.ts` (pure helper), `seedDemoWallet.ts` (factory returning the sequence of actions to seed a demo wallet), and a small `WalletView.css`. Everything in this directory is allowed to import from `src/domain/`. Nothing in `src/app/` or `src/pages/` imports from `src/features/wallet/` except `src/app/router.tsx`, which imports `WalletView` to render it at `/wallet`.

**Why:** The `ui-shell` spec's "domain-free shell" requirement is scoped to `src/app/` and `src/pages/` — the feature directory is outside that scope. Keeping features in their own directory also means future feature views (`add-account-form`, `transaction-log`, etc.) have an obvious home, and the shell remains a thin chrome layer. `router.tsx` is the one place that mixes concerns by necessity — it has to reference the page components it routes to — but it only imports the *component*, not domain primitives.

**Alternatives considered:**
- *Put `WalletView` in `src/pages/`.* Rejected: violates the `ui-shell` spec's scenario "Shell imports" (pages cannot import from `src/domain/`).
- *One flat `src/views/` for all future feature views.* Deferred: a single folder is fine at one feature; revisit when we have three or more and a clear grouping emerges.

### D3. Empty state seeds a demo wallet via a deterministic action sequence
**Decision:** When `state === null`, `WalletView` renders an empty state with a "Create demo wallet" button. Clicking it dispatches a fixed sequence of actions: `wallet/create`, two `account/add` (one USD "Checking", one EUR "Travel"), and two `transaction/post` (one per account). Ids are generated at dispatch time with `newId<...>()`; timestamps use `new Date().toISOString()`. The sequence is defined in a pure `buildDemoActions()` helper that returns `Action[]`; the component is responsible for iterating and dispatching.

**Why:** The reducer contract requires callers to supply ids and timestamps — `buildDemoActions` is the caller. Isolating it in a helper keeps `WalletView` readable and makes the action sequence itself trivially reviewable. Seeding makes the feature demonstrably working on first load without requiring us to ship a form in this same change.

**Alternatives considered:**
- *Ship with a hardcoded initial state instead of seeding via actions.* Rejected: bypasses the reducer, which means the seeded state would not be reproducible by the documented API and could drift from the reducer's invariants.
- *Skip the empty state and show a "no wallet" message only.* Rejected: the feature would look broken on first load and reviewers would have no way to see the balance/totals rendering without writing code themselves.

### D4. Money formatting is a local pure helper, not a dependency
**Decision:** `formatMoney(money: Money, locale = 'en-US'): string` returns a human-readable string. It looks up the currency's minor-unit exponent from a small hardcoded map (`{ USD: 2, EUR: 2, GBP: 2, JPY: 0, SEK: 2, ... }` — entries added as needed), converts `bigint` minor units to a decimal string via integer arithmetic (no `Number` conversion of the `bigint`), and then uses `Intl.NumberFormat(locale, { style: 'currency', currency })` to format. If the currency is not in the map, we fall back to exponent 2 and log a one-time `console.warn`.

**Why:** We avoid a new dependency (no `dinero.js`, no `currency.js`). We avoid precision loss by never calling `Number(bigint)` on the full amount — we split into integer and fractional parts via `bigint` division and build the string before handing it to `Intl`. `Intl.NumberFormat` gives us locale-correct symbols and grouping for free.

**Alternatives considered:**
- *`Number(money.amount) / 10**exp`.* Rejected: loses precision for amounts above `Number.MAX_SAFE_INTEGER / 100` (about 90 trillion cents). The domain uses `bigint` precisely to avoid this; the UI should not undo that.
- *Add `dinero.js` or similar.* Deferred: reconsider when we need arithmetic in the UI, rounding modes, or many more currencies. For a read-only list view with a handful of currencies, a 30-line helper is enough.

### D5. Totals row uses the existing `walletTotals` selector; balances use `balanceOfAccount`
**Decision:** `WalletView` calls `walletTotals(state)` once for the totals row, and `balanceOfAccount(state, account.id)` once per rendered account row. Archived accounts are shown with a visual "Archived" badge but are still listed and still contribute to totals (matching the domain spec's "Totals include archived accounts" scenario).

**Why:** Reuse the selectors that already exist and are specified by `wallet-domain`. Do not duplicate balance math in the UI. Showing archived accounts keeps the UI consistent with the domain's totals — hiding them would make the sum of visible rows not equal the totals row, which is confusing.

### D6. Rename `/app` → `/wallet` and relabel the nav entry to `"Wallet"`
**Decision:** The existing `{ to: '/app', label: 'App' }` entry in `navDestinations` becomes `{ to: '/wallet', label: 'Wallet' }`, and the corresponding route in the router config changes from `path: 'app'` to `path: 'wallet'`. The `/app` path is not preserved — there is no redirect, because there is no shippable history of `/app` linking out to anywhere (the placeholder has never been a real destination).

**Why:** `"App"` is a dev placeholder word that describes nothing. Once the route actually renders a wallet's accounts and totals, `/wallet` is the honest resource-oriented name: the domain models state as a single `Wallet | null`, so the route and the thing it shows line up one-to-one. Picking `/wallet` now (rather than deferring) avoids a second breaking rename later — every future internal link we write against `/app` would have to be updated when we renamed anyway.

**Alternatives considered:**
- *`/dashboard`.* Rejected for now: sets expectations (charts, widgets, cross-entity rollups) this view will not meet. The page is a single-wallet summary, not a dashboard in the conventional sense. Revisit if we later grow cross-wallet or cross-account summaries that warrant a purpose-oriented URL.
- *Keep `/app` as-is.* Rejected: described above — "App" is a placeholder label, not a descriptive one. The rename is cheaper now (one entry, no inbound links) than after a user has bookmarked it.
- *`/wallets` (plural).* Rejected: the domain is single-wallet by design (`DomainState = Wallet | null`). A plural URL would imply a collection that does not exist.

## Risks / Trade-offs

- **Risk: Provider mounted in `main.tsx` means every route pays the cost of creating the reducer, even `/` (Landing) and `*` (NotFound).** → Mitigation: acceptable — `useReducer` with a `null` initial state is essentially free. Revisit if we add expensive initialization (e.g., loading from storage) and it delays first paint.
- **Risk: In-memory state means refreshing the page wipes the demo wallet, which can confuse first-time testers.** → Mitigation: the empty-state CTA is always available on `/wallet`, so re-seeding is a single click. Persistence is a scheduled follow-up change, not an oversight.
- **Risk: `formatMoney`'s hardcoded currency-exponent map could drift from ISO-4217 reality if we add an exotic currency later.** → Mitigation: the fallback warns to the console, and the map is ~10 lines in one file — easy to audit and extend. Add a unit test once a test runner exists.
- **Risk: `seedDemoWallet` calls `newId()` and `new Date().toISOString()` at dispatch time, which means the "demo" state is non-deterministic across clicks (different ids, different timestamps).** → Mitigation: that is the correct boundary — the reducer stays pure, and the UI owns non-determinism, exactly as the `wallet-domain` spec prescribes. A test harness would inject a fake clock and id generator at the feature boundary.
- **Trade-off: No memoization of selectors.** `balanceOfAccount` is O(transactions) per account per render, so the list view is O(accounts × transactions) per render. For a personal wallet this is trivially small; if we grow to thousands of transactions we will revisit by memoizing at the provider level with `useMemo` keyed on `state`. Not worth the complexity today.
- **Trade-off: No URL-driven state.** Users can not share a link that opens on a specific account. Accepted — per-account routing is its own change.

## Migration Plan

There is no existing user-facing behavior at `/app` beyond a placeholder string, and no external link points to it, so no redirect or migration is needed. Rollout is a single atomic change: the placeholder route is renamed from `/app` to `/wallet`, its element switches from the placeholder to `<WalletView />`, the corresponding `navDestinations` entry is relabeled `"Wallet"`, and `main.tsx` gains a provider wrapper. Rollback is a `git revert` of the change commit.

## Open Questions

- Should the demo-wallet action include a voided transaction so reviewers can see how voided rows render? Leaning yes — add one voided transaction in `seedDemoWallet` so the balance/totals distinction is visible on first look. Confirm during implementation.
- Do we want a "Clear wallet" button in the list view for iteration convenience? Leaning no for this change — the reducer has no `wallet/delete` action, and adding one to the domain is out of scope here. Revisit if testers ask.
