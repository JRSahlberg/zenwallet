# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`, using project references) then produce a production bundle to `dist/`
- `npm run lint` — run ESLint across the repo using the flat config (`eslint.config.js`)
- `npm run preview` — serve the built `dist/` locally

No test runner is configured. If tests are introduced, update this file with the runner and single-test invocation.

## Architecture

The code enforces a strict three-layer separation. Respect the boundaries — they're the whole point.

- **`src/domain/`** — pure TypeScript. React-free, dependency-free, side-effect-free. Owns types and invariants every feature speaks in terms of.
  - **Money** is `{ amount: bigint; currency: Currency }` in **minor units**. No floats, ever.
  - **IDs** are branded string types (`WalletId`, `AccountId`, `TransactionId`); callers mint them via `newId<T>()`.
  - **`walletReducer(state, action)`** is pure and deterministic. Actions: `wallet/create`, `account/add`, `account/rename`, `account/archive`, `transaction/post`, `transaction/void`.
  - **Transactions are append-only.** "Delete" is `voided: true`; voided rows are excluded from balances but retained in state.
  - **Balances are derived, not stored.** Use selectors (`balanceOfAccount`, `transactionsForAccount`, `walletTotals`) — do not reimplement balance math in UI.
  - **Invariant violations throw `DomainError`** with a stable `code` (`UNKNOWN_ACCOUNT`, `CURRENCY_MISMATCH`, `ACCOUNT_ARCHIVED`, …).

- **`src/features/<feature>/`** — the only layer allowed to import from both shell and domain. The shell stays domain-free; the domain stays React-free. The wallet feature lives in `src/features/wallet/`:
  - `store.tsx` exposes `WalletStoreProvider` (wraps `useReducer(walletReducer, null)` in context) and `useWalletStore()`. Mounted once in `main.tsx` so every route shares the store. `useWalletStore()` throws if used outside the provider.
  - `formatMoney.ts` formats `Money` via `Intl.NumberFormat` **without** converting the full bigint to `number` — precision matters. Unknown currencies fall back to exponent 2 and warn once.

- **`src/app/` + `src/pages/`** — presentational shell. No domain imports, no storage, no I/O. Routing is React Router v7's data router (`createBrowserRouter` + `RouterProvider`).
  - **`app/router.tsx` is the single source of truth for top-level destinations.** It exports both `router` and a typed `navDestinations` array; `Navigation` maps over that array, so adding a route + nav entry is one edit.
  - `pages/NotFound.tsx` is wired as both the root `errorElement` and a `path: "*"` catch-all so unknown URLs render inside the shell.

## Tooling

- **TypeScript project references:** `tsconfig.json` is a thin root composing `tsconfig.app.json` (the `src/` app; `noEmit`, bundler resolution, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`) and `tsconfig.node.json` (Vite/ESLint configs). Build with `tsc -b`, not `tsc`, so both projects are checked.
- **ESLint flat config** (`eslint.config.js`): JS recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` flat recommended + `eslint-plugin-react-refresh` vite preset, scoped to `**/*.{ts,tsx}` with `dist` globally ignored. Type-aware rules are **not** enabled; if you want them, wire `parserOptions.project` to both tsconfigs as described in `README.md`.
- **React Compiler is intentionally disabled** per `README.md`; don't enable it without discussing the dev/build performance tradeoff.

## OpenSpec workflow

This repo uses spec-driven changes. `openspec/specs/` holds capability specs (e.g. `wallet-domain`, `ui-shell`, `wallet-list-view`); `openspec/changes/` holds in-flight and archived proposals; `openspec/config.yaml` holds project context and per-artifact rules. Use the `opsx:propose`, `opsx:explore`, `opsx:apply`, and `opsx:archive` skills to drive the workflow — prefer them over ad-hoc edits to `openspec/`.
