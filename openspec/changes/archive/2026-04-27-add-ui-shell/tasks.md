## 1. Setup

- [x] 1.1 Install `react-router-dom@^7` as a runtime dependency (and any required peer deps) via `npm install`
- [x] 1.2 Verify `npm run build` still type-checks before writing any new code (baseline)

## 2. Shell scaffolding

- [x] 2.1 Create `src/app/router.tsx` exporting a `createBrowserRouter`-based `router` and a typed `navDestinations: { to: string; label: string }[]` array; register the root route with `Layout` as `element` and `NotFound` as `errorElement`, plus at least one secondary destination (`/app`) rendering a "Coming soon" placeholder
- [x] 2.2 Create `src/app/Layout.tsx` rendering `<header><Navigation /></header><main><Outlet /></main><footer />` with semantic landmarks; import `Outlet` from `react-router-dom`
- [x] 2.3 Create `src/app/Layout.css` with a minimal layout baseline (full-height body, header/main/footer stacking)
- [x] 2.4 Create `src/app/Navigation.tsx` that maps `navDestinations` to `NavLink` components and applies an `active` class (or equivalent) via the `className` render prop
- [x] 2.5 Create `src/app/Navigation.css` styling the nav list and the active state

## 3. Pages

- [x] 3.1 Create `src/pages/Landing.tsx` as a default-exported component rendering an `<h1>ZenWallet</h1>` and at least one intro paragraph
- [x] 3.2 Create `src/pages/Landing.css` with landing-specific styles
- [x] 3.3 Create `src/pages/NotFound.tsx` as a default-exported component with an `<h1>` matching "Not found" (case-insensitive) and an anchor back to `/`
- [x] 3.4 Register `Landing` at path `/` in `router.tsx`; register `NotFound` as `errorElement` on the root route and also as a catch-all (`path: "*"`) to cover unmatched URLs
- [x] 3.5 Add a stub page component for the `/app` destination (inline in `router.tsx` is fine) that renders "Coming soon"

## 4. Wire `main.tsx` and remove starter code

- [x] 4.1 Rewrite `src/main.tsx` to render `<RouterProvider router={router} />` inside `<StrictMode>`; keep the existing `import './index.css'` import
- [x] 4.2 Delete `src/App.tsx`, `src/App.css`, and any starter assets no longer imported (`src/assets/react.svg` if unused)
- [x] 4.3 Confirm `public/vite.svg` is no longer referenced from rendered code (file can remain on disk)

## 5. HTML + copy cleanup

- [x] 5.1 Update `<title>` in `index.html` to exactly `ZenWallet`
- [x] 5.2 Remove any starter-only meta tags or comments left over from the Vite template

## 6. Verification

- [x] 6.1 Run `npm run lint` and fix any violations
- [x] 6.2 Run `npm run build` and confirm `tsc -b` + the Vite bundle both succeed
- [x] 6.3 Start `npm run dev` and manually verify: `/` renders Landing inside the shell; nav shows active state on `/`; clicking the second destination navigates and updates the active link; visiting `/nope` renders `NotFound` inside the shell
- [x] 6.4 Grep `src/app/` and `src/pages/` for imports from `../domain`/`./domain`/`src/domain` and for `fetch`, `localStorage`, `sessionStorage`, `indexedDB`, `Date.now()` — confirm zero matches
- [x] 6.5 Grep `src/` for `reactLogo`, `viteLogo`, and `./assets/react.svg` — confirm zero matches reachable from `main.tsx`

## 7. Archive

- [x] 7.1 Run `openspec validate add-ui-shell` (or the equivalent status command) to confirm all artifacts are marked done before archival
- [x] 7.2 After merge, archive the change with `/opsx:archive` so specs are promoted into `openspec/specs/ui-shell/`
