## Why

`src/App.tsx` is still the Vite starter template, so the app has no way to render anything beyond the logo demo. Before we can wire the `wallet-domain` module to an interactive surface, we need a durable UI shell — a landing entry point, a consistent layout (header/main/footer chrome), and navigation between top-level views — that later features can slot into without re-architecting the tree.

## What Changes

- Replace `src/App.tsx` with a new UI shell that composes a layout and a router outlet.
- Introduce a top-level **Layout** component providing the app chrome: a header with the product name, a primary navigation region, and a main content slot.
- Introduce a **Navigation** component that lists the app's top-level destinations and highlights the active one.
- Introduce a **Landing** page rendered at the root route, explaining what ZenWallet is and inviting the user into the app.
- Add client-side routing with typed routes, so future features (wallets, accounts, transactions) can be added as sibling routes without touching the shell.
- Add a minimal visual baseline (global reset, layout CSS, nav styling) that future screens can extend.
- Update `index.html` `<title>` and any starter cruft left over from the Vite template.
- **BREAKING** for anything importing from `src/App.tsx`: the old starter export is gone. Nothing in the repo currently depends on it.

## Capabilities

### New Capabilities
- `ui-shell`: The app's top-level UI contract — what the user sees before they pick a feature. Covers the landing page, the layout chrome, the navigation region, and the routing surface that hosts feature pages.

### Modified Capabilities
<!-- None. wallet-domain is untouched by this change. -->

## Impact

- **Code:** replaces `src/App.tsx`; adds `src/ui/` (or equivalent) for shell components and routes; adds a routes entry point consumed by `src/main.tsx`.
- **Dependencies:** adds a routing library (e.g. `react-router-dom` v7) to `package.json`. No other runtime additions.
- **Build/lint:** no changes to `tsconfig*`, `vite.config.ts`, or `eslint.config.js` are required; new files must satisfy the existing `noUnusedLocals`/`noUnusedParameters` and `react-hooks`/`react-refresh` rules.
- **Domain:** none — `src/domain/` and the `wallet-domain` spec are not touched.
- **Docs:** `README.md` may want a short note that the app now boots into a real shell; out of scope for this change unless trivial.
