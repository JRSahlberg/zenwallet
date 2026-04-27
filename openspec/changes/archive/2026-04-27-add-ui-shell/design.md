## Context

ZenWallet's domain layer (`src/domain/`, spec: `wallet-domain`) is in place but the app still boots into the default Vite starter (`src/App.tsx`). There is no layout, no routing, and no navigation — every future feature would otherwise have to invent its own chrome.

The repo constrains the design in a few concrete ways:
- React 19 + TypeScript on Vite, strict tsconfig with `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax`.
- ESLint flat config with `react-hooks` and `react-refresh/vite` — components must stay HMR-friendly (named exports for non-pages, single default export per route file).
- **React Compiler is disabled** by project decision — don't rely on compiler-only memoization.
- `wallet-domain` is React-free and must stay that way — the shell imports from it only if it needs domain types, never the other way around.

Stakeholder: the project owner (solo build at this stage). The shell's main audience is future-me — it has to be trivial to add a new route without touching the nav, layout, or router wiring beyond one line.

## Goals / Non-Goals

**Goals:**
- Replace the Vite starter `App.tsx` with a real app shell composed of a `Layout` and a route outlet.
- Provide a `Landing` page at `/` that explains the product and points the user into the app.
- Provide a `Navigation` component that lists top-level destinations, uses semantic landmarks, and shows which destination is active.
- Establish a routing surface (React Router v7 data-router) that future features can extend by adding a single route entry.
- Keep the shell purely presentational — no domain state, no storage, no I/O.
- Keep the visual baseline minimal but usable: a global reset/base styles file, plus component-scoped CSS for the shell.

**Non-Goals:**
- Implementing any feature pages (wallet creation, account list, transaction posting). Those land in follow-up changes and only require adding a new route.
- Theming, dark mode, design tokens, or a component library.
- Authentication, server-side routing, SSR, or code-splitting. (Vite's default lazy behavior is fine; we don't explicitly split routes yet.)
- State management for the shell beyond what the router provides. No Redux/Zustand/Context needed here.
- Touching `src/domain/` or the `wallet-domain` spec.

## Decisions

### Router: React Router v7 (data-router, `createBrowserRouter`)

Use `react-router-dom@^7` with `createBrowserRouter` + `RouterProvider`. Routes are declared as a static config array consumed by `src/main.tsx`.

**Why:** Most widely understood routing library in the React ecosystem; works out of the box with Vite and React 19; the data-router API makes it easy to attach loaders/actions later when we wire features to the domain; `NavLink` provides active-state styling without custom logic.

**Alternatives considered:**
- *TanStack Router* — more type-safe routes but adds a Vite plugin and a learning curve; overkill for a shell with two or three routes today.
- *Hand-rolled `useState`-based router* — trivially simple today but we'd throw it away the moment we need nested routes, data loading, or not-found handling. Not worth the false economy.

### File layout: `src/app/` for shell, `src/pages/` for route components

```
src/
  main.tsx                 // mounts RouterProvider with the router from app/router.tsx
  app/
    router.tsx             // createBrowserRouter config, single place to register routes
    Layout.tsx             // <header><Navigation /></header><main><Outlet /></main><footer />
    Layout.css
    Navigation.tsx         // <nav> with NavLink items, destinations imported from routes config
    Navigation.css
  pages/
    Landing.tsx            // default-exported page component
    Landing.css
    NotFound.tsx           // default-exported page component for errorElement / catch-all
```

**Why:** Separates shell (infrastructure) from pages (destinations). `app/router.tsx` owns the single source of truth for top-level destinations so `Navigation` can derive its items from the same list rather than maintaining a parallel array. Page files use default exports per `react-refresh/only-export-components` guidance.

**Alternatives considered:**
- *Flat `src/ui/`* — fine for two components but the shell/page distinction starts mattering as soon as the second page lands.
- *Feature-first layout (`src/features/<name>/`)* — premature until features exist. The shell is not a feature.

### Navigation items derived from the routes config

Export a typed `navDestinations` array from `app/router.tsx` (`{ to: string; label: string }[]`). The `Navigation` component maps over it to render `NavLink`s. Adding a new top-level destination means adding one entry to that array and one route object — nothing else.

**Why:** Prevents the classic bug where someone adds a route but forgets to update the nav, or vice versa.

### Layout uses semantic landmarks

`Layout` renders `<header>`, `<nav>` (inside `header`), `<main>`, and `<footer>`. `Navigation` uses `NavLink` with `aria-current="page"` (React Router v7 sets this automatically on active links). No skip-link for now; revisit when keyboard nav coverage grows.

### Styling: plain CSS modules-by-convention

Keep using plain `.css` files imported from components, matching the existing `App.css` / `index.css` pattern. Scope by file name (`Layout.css`, `Navigation.css`). No CSS Modules (`.module.css`) configuration needed unless class collisions bite us. No Tailwind or CSS-in-JS.

**Why:** Matches what's already here; avoids a dependency decision we don't need to make today. Can migrate to CSS Modules later with a rename and no build changes.

### `index.html` cleanup

Update `<title>` from the Vite default to `ZenWallet`. Remove the starter Vite SVG reference from the rendered app (the `public/vite.svg` file itself can stay or go — not load-bearing either way).

## Risks / Trade-offs

- **Lock-in to React Router v7** → Mitigation: routing surface is encapsulated in `app/router.tsx` and the `Layout`/`Navigation` pair. Swapping routers later means rewriting those three files, not a sprawl of route-specific hooks across pages.
- **Nav drifting out of sync with routes** → Mitigation: derive `navDestinations` from the same module that owns the route config; do not let pages maintain their own nav entries.
- **Adding react-router-dom grows the bundle** → Mitigation: accepted; v7 core is small and we need a router regardless. Revisit only if bundle budget becomes a stated concern.
- **`App.tsx` removal could break someone's mental model** → Mitigation: we keep the file as a thin re-export of the router-mounted shell, or document the move in `proposal.md`'s Impact section (already done). Either works; preference is to delete `App.tsx` outright since `main.tsx` now mounts `RouterProvider` directly.
- **Landing page starts as a stub** → Mitigation: acceptable; the point of this change is the shell, not landing-page copy. Real copy can land in a follow-up without touching the shell.

## Migration Plan

Single-commit migration — nothing depends on the old `App.tsx` today.

1. Install `react-router-dom@^7`.
2. Add `src/app/router.tsx`, `Layout.tsx`, `Navigation.tsx` (+ CSS).
3. Add `src/pages/Landing.tsx`, `NotFound.tsx` (+ CSS).
4. Rewrite `src/main.tsx` to render `<RouterProvider router={...} />`.
5. Delete `src/App.tsx`, `src/App.css`, and the starter logo assets that are no longer imported.
6. Update `index.html` `<title>`.
7. Run `npm run lint` and `npm run build` — both must pass.

Rollback: `git revert` the single commit. No data, no migrations, nothing persistent to undo.

## Open Questions

- Do we want the landing page to link to a `/wallet` stub route now, or only introduce `/wallet` when the wallet feature lands? *Tentative answer:* introduce a single "App" destination in nav pointing at a placeholder `/app` route that renders "Coming soon" — gives us something to demonstrate active-link styling against and a clear seam for the next change to replace. Revisit if that feels like premature scaffolding.
- Footer contents — version string? Link to repo? *Tentative answer:* empty `<footer>` for now, styled to hold its height; content is not in scope.
