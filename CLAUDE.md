# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`, using project references) then produce a production bundle to `dist/`
- `npm run lint` — run ESLint across the repo using the flat config (`eslint.config.js`)
- `npm run preview` — serve the built `dist/` locally

No test runner is configured. If tests are introduced, update this file with the runner and single-test invocation.

## Architecture

- **Stack:** React 19 + TypeScript ~6.0 on Vite 8, rendered from `src/main.tsx` into `#root` in `index.html`. `App.tsx` is still the default Vite starter — ZenWallet has no domain code yet, so treat `src/` as a blank slate.
- **TypeScript project references:** `tsconfig.json` is a thin root that references `tsconfig.app.json` (the `src/` app, `noEmit`, bundler resolution, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`/`noUnusedParameters`) and `tsconfig.node.json` (Vite/ESLint configs). Build with `tsc -b`, not `tsc`, so both projects are checked.
- **ESLint flat config** (`eslint.config.js`): JS recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` flat recommended + `eslint-plugin-react-refresh` vite preset, scoped to `**/*.{ts,tsx}` with `dist` globally ignored. Type-aware rules are **not** enabled; if you want them, wire `parserOptions.project` to both tsconfigs as described in `README.md`.
- **React Compiler is intentionally disabled** per `README.md`; don't enable it without discussing the dev/build performance tradeoff.

## OpenSpec workflow

This repo uses the OpenSpec spec-driven workflow. `openspec/config.yaml` holds project context and per-artifact rules (both currently empty), `openspec/specs/` holds capability specs, and `openspec/changes/` holds in-flight and archived change proposals. Corresponding skills are available as `openspec-propose`, `openspec-explore`, `openspec-apply-change`, and `openspec-archive-change` (also exposed under the `opsx:` namespace). Prefer these skills over ad-hoc edits when adding or modifying specs and changes.
