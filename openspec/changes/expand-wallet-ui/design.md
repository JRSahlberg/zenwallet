## Context

ZenWallet has a clean three-layer split: a pure domain (`src/domain/`), a feature bridge (`src/features/wallet/`), and a presentational shell (`src/app/`, `src/pages/`). The current `/wallet` page renders a demo wallet from an in-memory store that dies on refresh. This change takes the app from "proof of domain model" to "usable, routed MVP" by adding persistence, four new screens, and minor domain extensions — without breaking the layer boundaries encoded in the existing specs.

Key constraints:

- The domain must remain **React-free, dependency-free, side-effect-free**. No `localStorage`, no timers, no `Date.now()`.
- The shell (`src/app/`, `src/pages/`) must remain **domain-free**. Only `router.tsx` and `main.tsx` may cross into `src/features/`.
- All monetary math stays in `bigint` minor units — no `Number(bigint)` on amounts.
- No new runtime dependencies; React Router v7 and React 19 cover forms, navigation, and state.
- No test runner exists; correctness is gated by `tsc -b` + `eslint` + manual dev-server walkthrough.

## Goals / Non-Goals

**Goals:**

- Wallet state survives a page refresh (localStorage, automatic save).
- A user can add a transaction end-to-end from the UI and see it reflected in dashboard totals, the transactions list, the account card, and account detail.
- The `/wallet` dashboard answers: *what do I have, what did I earn this month, what did I spend this month, where did the spend go, what just happened.*
- Navigation reflects the five top-level destinations (Home, Wallet, Transactions, Accounts, Add) from a single source.
- Layer boundaries from `wallet-domain`, `ui-shell`, and `wallet-list-view` specs stay intact; cross-layer imports are only added through `router.tsx` / `main.tsx`.

**Non-Goals:**

- **Multi-user, multi-wallet, or cloud sync.** Storage is local to the browser.
- **Editing or deleting transactions post-submit.** Voiding already exists in the domain but is not exposed in this UI pass.
- **Transfers between accounts as a first-class transaction type.** Modeled today as two separate postings; no special UI.
- **Dynamic categories, budgets, goals, reports, charts.** Categories are a static catalog; no aggregation beyond month totals and top-category.
- **i18n, accessibility audit, theming.** Layouts should be responsive and semantically correct but we are not running WCAG tooling.
- **Unit tests.** No runner is wired; adding one is out of scope here.

## Decisions

### 1. Persistence lives in the feature layer, not the domain

A new `src/features/wallet/persistence.ts` module exposes `loadWalletState(): DomainState` and `saveWalletState(state: DomainState): void`. The `WalletStoreProvider` initializes its reducer with `loadWalletState()` and subscribes via `useEffect` to persist on every state change.

**Alternatives considered:**
- *Storage inside the domain.* Rejected — would break `wallet-domain`'s "React-free, dependency-free, side-effect-free" invariant, and would make the module unusable in Node/tests.
- *A custom middleware layer.* Rejected as over-engineered for a single store and a single storage backend.

### 2. bigint-safe JSON codec

`JSON.stringify` throws on `bigint`. We implement a small codec inside `persistence.ts`: `serialize` replaces each `bigint` with `{ $bigint: string }` and `deserialize` reverses it. The codec only traverses known-shape objects (domain types), so there is no general-purpose tagging needed. A version field (`v: 1`) is written at the envelope so future migrations have a handle.

**Alternatives considered:**
- *Convert to string at the `Money` boundary only.* Rejected — requires a parallel "wire type" that diverges from the domain type; adds friction for every new bigint field.
- *`JSON.stringify` replacer + reviver using `typeof === "bigint"` detection.* Accepted conceptually; that is what the codec implements, wrapped in a `serialize` / `deserialize` function so call sites stay short.

### 3. On rehydrate failure, drop and re-seed

If parsing fails, if the schema version is unknown, or if the loaded payload is missing the new `payee` / `category` fields, `loadWalletState` returns `null` and logs a single `console.warn`. The demo-seed empty state then kicks in on next render. No migration path is built.

**Rationale:** this is a pre-release demo app; the cost of a migration framework is much higher than the cost of a one-time re-seed. If we ship "real" users later we add versioned migrations then.

### 4. Extend `Transaction` with `payee` and `category`, both required strings

`Transaction` becomes `{ id, accountId, amount, occurredAt, payee: string, category: string, memo?: string, voided }`. The reducer's `transaction/post` case validates both non-empty; `DomainError` codes gain `MISSING_PAYEE` and `MISSING_CATEGORY`. The demo seed is updated to supply them.

**Alternatives considered:**
- *Keep them optional.* Rejected — the UI assumes they exist (search, top-category, filters). Optional fields push the "must exist" check out of the domain into every consumer.
- *Put `category` on a separate `Categorization` entity.* Rejected — overkill for a static catalog. Category is a flat string on the transaction.
- *Reuse `memo` as `payee`.* Rejected — memo is free-form and optional; payee is the structured "who" that search expects.

### 5. Income vs. expense stays encoded in amount sign

Positive amounts are income, negative are expenses. The add-transaction form is the only place we care about the "type" distinction: the type selector controls the sign of the posted amount and filters the category list. We do not add a `kind: 'income' | 'expense'` field to `Transaction`.

**Rationale:** the sign already carries the semantics consistently across the reducer, the balance selector, and the totals selector. Adding a redundant field invites divergence (type says income, amount is negative — which wins?).

### 6. Categories are a typed static catalog in the feature layer

`src/features/wallet/categories.ts` exports `INCOME_CATEGORIES: readonly string[]` and `EXPENSE_CATEGORIES: readonly string[]` plus a union type `Category = typeof INCOME_CATEGORIES[number] | typeof EXPENSE_CATEGORIES[number]`. The domain stores `category: string` (unconstrained) — the feature layer narrows it for the form and filter UI.

**Rationale:** keeping the enum in the feature layer avoids coupling the domain to a product-level list that we expect to change. The domain cares that *some* category is attached; the UI cares about *which* ones are selectable.

### 7. Month-scoped selectors go in the domain

`src/domain/selectors.ts` gains:

- `monthlyTotals(wallet, monthStart, monthEnd): { income: bigint; expense: bigint; currency: Currency }[]` — one entry per currency touched in the window.
- `topSpendingCategory(wallet, monthStart, monthEnd): { category: string; total: bigint; currency: Currency } | null` — returns the highest expense-total category across the window, or `null` when no expenses.

Both take a pre-computed `[start, end)` window from the caller so the domain stays time-free (no `new Date()` inside the domain). The dashboard computes the window once per render using `new Date()` in the feature layer.

### 8. Dashboard replaces the current `/wallet` body; empty-state preserved

`WalletView` keeps its two-branch top-level structure: `state === null` renders the existing empty state + "Create demo wallet" button (unchanged contract); non-null renders the new dashboard. The dashboard is a single component composed of small presentational subcomponents (`NetWorthCard`, `MonthTotalsCard`, `TopCategoryCard`, `AccountSummaryList`, `RecentTransactionsPanel`). All balance math stays on domain selectors; no inline loops over `transactions`.

**Rationale:** the `wallet-list-view` spec's empty-state contract is already correct; we only modify the populated branch. Keeping subcomponents small and dumb makes the layout responsive without needing a framework.

### 9. Transactions, Accounts, and Add are page modules that consume feature components

Each new route (`/transactions`, `/accounts`, `/accounts/:accountId`, `/add`) is a thin `pages/` module that imports a presentational feature component (e.g. `pages/Transactions.tsx` → `features/wallet/TransactionsView.tsx`). The feature component does the store read and the domain call; the page is responsible only for layout + heading. This mirrors how `/wallet` currently delegates to `WalletView`.

**Rationale:** keeps `router.tsx` flat (one import per route), and keeps the page files trivial (no domain imports at all, preserving the existing shell-isolation scenario in `ui-shell`).

### 10. Account detail is a nested child of `/accounts`

Router config:

```
{ path: 'accounts', element: <AccountsPage />, children: [
  { index: true, element: <AccountsList /> },
  { path: ':accountId', element: <AccountDetail /> },
]}
```

`AccountsPage` renders the net-worth header and an `<Outlet />`; the index route renders the card grid; `:accountId` renders the detail view. "Back navigation" is a `<NavLink to=".." />` inside `AccountDetail`.

**Alternative considered:** flat routes (`/accounts` and `/accounts/:id` as siblings). Rejected because the net-worth header is shared chrome; nesting avoids duplicating it in two pages.

### 11. Add form uses a controlled React component; submit dispatches directly

`pages/Add.tsx` → `features/wallet/AddTransactionForm.tsx` uses `useState` for each field plus a local errors object. On valid submit the form generates `newId<TransactionId>()` and `new Date().toISOString()`, dispatches `transaction/post`, resets the fields, and shows a transient success message (local `useState<string | null>` cleared by `setTimeout`).

**Alternatives considered:**
- *React Router `<Form>` + action.* Rejected — actions are designed for remote submissions; here the dispatch is synchronous to the in-memory store.
- *A form library (react-hook-form).* Rejected — adds a dependency for ~6 fields.

### 12. Amount input accepts decimals, converts to bigint minor units at submit

The form accepts `"12.34"` in a text input and converts to minor units via bigint arithmetic (split on `.`, left-pad / right-pad the fractional part to the currency's exponent, concatenate, `BigInt(...)`). This conversion lives in `features/wallet/parseMoneyInput.ts` — a sibling to the existing `formatMoney.ts`, symmetric in purpose. The parser rejects invalid input with a typed error and is surfaced as an inline form error.

**Rationale:** users expect `$12.34`, not `1234`. Keeping the parser as a pure function makes it trivially reviewable and reusable.

### 13. Navigation is a five-item single source

`navDestinations` grows to `[{ to: '/', label: 'Home' }, { to: '/wallet', label: 'Wallet' }, { to: '/transactions', label: 'Transactions' }, { to: '/accounts', label: 'Accounts' }, { to: '/add', label: 'Add' }]`. The existing `ui-shell` scenarios about active state, aria-current, and single-source navigation continue to hold unchanged.

## Risks / Trade-offs

- **[localStorage quota / corruption]** → Mitigation: try/catch around `setItem` and `getItem`, drop-and-reseed on parse failure with a single `console.warn`. Quota exhaustion is realistically unreachable for a demo wallet (kilobytes, not megabytes).
- **[bigint codec incorrectly rehydrates a non-bigint shaped like `{$bigint: "123"}`]** → Mitigation: only the domain types are serialized, and the reviver checks that the parent key is one we expect to be a bigint (e.g. `amount`). The risk is theoretical for this data shape.
- **[Date-window math across timezones / month boundaries]** → Mitigation: the feature layer computes `[start, end)` using the user's local timezone (`new Date(year, month, 1)`), and the domain selectors just do `occurredAt >= start && occurredAt < end` comparisons on ISO strings. Good enough for single-user local demo; we accept that DST-edge transactions on the first-of-month boundary are not specially handled.
- **[Dashboard re-renders on every dispatch]** → Mitigation: acceptable at MVP scale (dozens of transactions). If we later see jank, move to `useSyncExternalStore` or memoized selectors — noted but not built.
- **[Form amount parser rounding errors]** → Mitigation: bigint-only path (no `parseFloat`); reject strings that don't match `^-?\d+(\.\d{1,exponent})?$` after normalization.
- **[Breaking existing persisted state on shape change]** → Acceptable by decision 3. Version field gives us a hook if we later need migrations.
- **[Layer drift as the app grows]** → Mitigation: the existing `wallet-domain` and `ui-shell` specs carry grep-based "no imports from X" scenarios; this change adds the same style of scenario for the new feature modules (no `react` in domain, no `localStorage` in shell).

## Migration Plan

1. Land domain changes first (`payee`, `category`, new selectors, new error codes, demo-seed update) — the feature layer cannot compile without them.
2. Land persistence + provider wiring; at this point the app still looks the same but state survives refresh.
3. Land categories catalog + parseMoneyInput — small pure modules, no UI wiring.
4. Land `/add` form — once this ships, users can produce real data.
5. Land `/transactions`, `/accounts` + detail, navigation update — each is a leaf addition.
6. Replace the `/wallet` populated view with the dashboard last, so the old list is available as a fallback during development.

**Rollback:** each step is a local commit; `localStorage` is dropped on schema mismatch, so reverting the domain shape on disk is automatic.

## Open Questions

- Should the dashboard's "recent transactions" row link to `/transactions` with a pre-applied filter, or to the relevant `/accounts/:id`? Current plan: link each row to `/accounts/:id` of the row's account; the panel header links to `/transactions`. Revisit if this feels clumsy in the browser.
- Should the Add form allow picking an `occurredAt` in the past? Current plan: always `new Date().toISOString()` at submit; backdating can come later.
- Should `category` be a free-text fallback ("Other" + custom string) or strictly the catalog? Current plan: strictly the catalog; "Other" covers edge cases.
