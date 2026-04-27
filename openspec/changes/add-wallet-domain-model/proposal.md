## Why

ZenWallet currently ships only the Vite starter (`src/App.tsx` is the default counter demo) with no domain code. Before we build any UI, screens, or persistence, we need a stable vocabulary — wallets, accounts, transactions, money — so every later feature can be expressed in terms of the same types and rules rather than re-inventing them per screen.

## What Changes

- Introduce a `wallet-domain` capability that defines the core domain entities (Wallet, Account, Transaction), value objects (Money, Currency), and the invariants that connect them (e.g. a transaction belongs to exactly one account; an account's balance is derived from its transactions).
- Add a pure TypeScript domain module under `src/domain/` with immutable types and small pure helpers (create/post/query). No React, no storage, no I/O.
- Add an in-memory domain state container (reducer-style) that is the single source of truth for domain state in-memory. UI layers will be added in later changes and consume this module.
- Leave `App.tsx`, routing, persistence, and styling untouched in this change — those are explicit non-goals and land in follow-up changes.

## Capabilities

### New Capabilities
- `wallet-domain`: Defines wallets, accounts, transactions, money/currency, and the pure operations and invariants that govern them. Owns the domain types and the reducer that mutates domain state in-memory.

### Modified Capabilities
<!-- None — this is the first capability in the project. -->

## Impact

- **New code:** `src/domain/` (types, money, wallet, account, transaction, reducer, index barrel). All pure TypeScript, no runtime dependencies added.
- **Untouched:** `src/App.tsx`, `src/main.tsx`, styles, Vite/ESLint/TS config. `npm run dev` still renders the starter page.
- **Specs:** new `openspec/specs/wallet-domain/spec.md` once this change is archived.
- **Dependencies:** none added. Domain is standard-library-only TypeScript; money is represented in minor units as `bigint` to avoid float drift.
- **Downstream:** unblocks later changes for UI shell, persistence, and import/export — each of those will depend on the types and reducer introduced here.
