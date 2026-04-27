# ZenWallet

A small, in-progress personal-finance app. Built with React 19, TypeScript, and Vite.

## Status

Early. The app boots into a real UI shell (layout, navigation, routing) with a landing page at `/` and a wallet list view at `/wallet`. The `/wallet` page shows an empty state with a "Create demo wallet" button until a wallet exists, then lists accounts with per-account balances and per-currency totals. The pure-TypeScript domain layer under `src/domain/` backs the feature.

## Scripts

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) and produce a production bundle in `dist/`
- `npm run lint` — ESLint (flat config)
- `npm run preview` — serve the built `dist/` locally

No test runner is wired up yet.

## Project layout

```
src/
  app/       # UI shell: router, Layout, Navigation (presentational, domain-free)
  pages/     # route components: Landing, NotFound
  features/  # bridges between shell and domain (e.g. wallet: store, WalletView)
  domain/    # pure TS: wallets, accounts, transactions, money, reducer, selectors
  main.tsx   # mounts <WalletStoreProvider> around <RouterProvider>
openspec/    # spec-driven change workflow (proposals, specs, tasks)
```

## Domain module (`src/domain/`)

The domain layer is React-free, dependency-free, and side-effect-free. It owns the types and the invariants that every later feature will speak in terms of.

- **Money** as `{ amount: bigint; currency: Currency }` in minor units — no floats.
- **IDs** are branded string types (`WalletId`, `AccountId`, `TransactionId`); callers generate them via `newId<T>()`.
- **Reducer** `walletReducer(state, action)` is pure and deterministic. Actions: `wallet/create`, `account/add`, `account/rename`, `account/archive`, `transaction/post`, `transaction/void`.
- **Transactions are append-only.** "Delete" is modelled as `voided: true`; voided rows are excluded from balances but retained in state.
- **Balances are derived,** not stored. Selectors: `balanceOfAccount`, `transactionsForAccount`, `walletTotals`.
- **Errors** are typed. Invariant violations throw `DomainError` with a stable `code` (`UNKNOWN_ACCOUNT`, `CURRENCY_MISMATCH`, `ACCOUNT_ARCHIVED`, …).

The rationale lives in `openspec/specs/wallet-domain/` (archived proposal at `openspec/changes/archive/*-add-wallet-domain-model/`).

## UI shell (`src/app/`, `src/pages/`)

The shell is purely presentational — no domain imports, no storage, no I/O. Routing uses React Router v7's data router (`createBrowserRouter` + `RouterProvider`).

- **`app/router.tsx`** is the single source of truth for top-level destinations. It exports both the `router` and a typed `navDestinations` array; `Navigation` maps over the same array so adding a route and adding a nav entry is one edit.
- **`app/Layout.tsx`** renders semantic `<header><nav/></header><main><Outlet/></main><footer/>`.
- **`pages/NotFound.tsx`** is wired as both the root `errorElement` and a `path: "*"` catch-all, so unknown URLs render inside the shell.

Spec: `openspec/specs/ui-shell/` (archived proposal at `openspec/changes/archive/*-add-ui-shell/`).

## Wallet feature (`src/features/wallet/`)

The feature module is the only code that imports both the shell and the domain. The shell stays domain-free; the domain stays React-free.

- **`store.tsx`** exposes `WalletStoreProvider` (wraps `useReducer(walletReducer, null)` in a React context) and `useWalletStore()` (returns `{ state, dispatch }`, throws when used outside the provider). Mounted once in `main.tsx` so every route shares the same store.
- **`WalletView.tsx`** renders the empty state or the populated list. Balances come from `balanceOfAccount`; totals from `walletTotals`; no balance math is reimplemented in the UI.
- **`formatMoney.ts`** formats `Money` (bigint minor units) via `Intl.NumberFormat` without converting the full amount to `number`, so precision is preserved for large values. Unknown currencies fall back to exponent `2` and warn once.
- **`seedDemoWallet.ts`** builds a deterministic action sequence for the demo button; ids come from `newId<T>()` and timestamps from `new Date().toISOString()` at click time.

Spec: `openspec/specs/wallet-list-view/` (archived proposal at `openspec/changes/archive/*-wallet-list-view/`).

## Tooling notes

- **TypeScript project references:** `tsconfig.json` composes `tsconfig.app.json` (source) and `tsconfig.node.json` (tooling). Build with `tsc -b`.
- **Strict-ish TS config:** `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`. Type-aware ESLint rules are not enabled.
- **React Compiler is disabled** for now, to keep dev/build time down.

## Workflow

This repo uses [OpenSpec](https://github.com/openspec-ai/openspec)-style spec-driven changes. Proposals, specs, and tasks live under `openspec/`. Use the `opsx:propose` / `opsx:apply` / `opsx:archive` skills to drive the workflow instead of editing `openspec/` by hand.
