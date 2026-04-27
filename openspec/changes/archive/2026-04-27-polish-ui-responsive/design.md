## Context

ZenWallet today ships:
- A shell (`src/app/Layout.tsx`, `Navigation.tsx`) that renders `<header><nav>…</nav></header><main/><footer/>` with no brand identity.
- Feature-scoped CSS files (`WalletView.css`, `TransactionsView.css`, `AccountsView.css`) that each redeclare card borders, dashed dividers, grid columns, and ad-hoc colors (`#2f9e44`, `#c03636`, `rgba(127,127,127,0.25)`, etc.).
- Root tokens in `src/index.css` covering only `--text`, `--bg`, `--border`, `--accent`, and a couple of accent variants — insufficient for positive/negative amounts, raised surfaces, muted text, or a spacing scale.
- `#root` is pinned to `1126px` with a centered border — pleasant on desktop, but on phones the 24px page padding plus the bordered root means content hugs the edges.
- A `@media (max-width: 480px)` block in each feature CSS reflows grids to two columns, but the breakpoint isn't coordinated with Layout or Navigation.

The polish pass is presentational only — no JSX restructure beyond the header and no domain/feature logic changes. The architecture constraint (`src/app/` + `src/pages/` stay domain-free; `src/features/wallet/` is the bridge) remains in force.

## Goals / Non-Goals

**Goals:**
- A shared token vocabulary (color, spacing, radius, shadow, type scale) in `src/index.css` consumed by every stylesheet.
- A branded header with a wordmark and tagline that communicates "ZenWallet" at a glance.
- Consistent vertical rhythm across pages using the new spacing scale.
- Transaction rows with real hierarchy: payee prominent, meta muted, amounts right-aligned and colored by sign.
- Clean mobile stacking behavior: cards take full width, transaction rows collapse to a two-row block, nav remains usable (horizontal scroll, not squeezed).
- WCAG AA contrast in both light and dark modes for primary text, muted text, and interactive elements.
- Touch-friendly targets (≥44px) for nav links, buttons, and card links on mobile.

**Non-Goals:**
- No animation library, no icon library, no CSS-in-JS, no Tailwind — stay with plain CSS and custom properties.
- No redesign of the information architecture: the dashboard, transactions, accounts, and add-transaction screens keep their current layout blocks.
- No additions to `package.json`.
- No domain or reducer changes.
- No theme switcher UI — dark mode continues to follow `prefers-color-scheme`.
- No React Compiler flip.

## Decisions

### 1. Token taxonomy

We introduce a semantic, not literal, token set in `:root` and shadow it in the `prefers-color-scheme: dark` block. Choosing semantic tokens (`--surface`, `--surface-raised`, `--text-muted`, `--positive`, `--negative`) over literal names (`--gray-200`, `--green-500`) means feature CSS doesn't need to branch per theme.

Tokens added:

- Color: `--surface`, `--surface-raised`, `--surface-sunken`, `--text`, `--text-strong`, `--text-muted`, `--accent`, `--accent-strong`, `--accent-soft`, `--positive`, `--positive-soft`, `--negative`, `--negative-soft`, `--border`, `--border-strong`.
- Spacing: `--space-1` through `--space-6` on a 4-8-12-16-24-32 ramp.
- Radius: `--radius-sm` (4), `--radius-md` (8), `--radius-lg` (12), `--radius-pill` (999).
- Shadow: `--shadow-sm`, `--shadow-md`.
- Type: keep current `--sans`/`--mono` plus a `--font-size-eyebrow`/`-body`/`-title` scale so feature styles stop inlining `0.7rem` / `1.15rem`.

**Alternative considered:** a utility-class system (Tailwind-style). Rejected — it would add a toolchain dependency and the repo's existing pattern is co-located feature CSS.

**Alternative considered:** keeping literal color tokens (`--gray-100`, `--green-600`) and composing semantic names per feature. Rejected — doubles the token surface and pushes theme branching into features.

### 2. Branded header

The header gets a two-slot flex layout: a `.brand` group (mark + wordmark + tagline) on the left, the existing `<Navigation />` on the right. The wordmark uses the `--text-strong` color; the mark is a small SVG or styled span using `--accent`; the tagline (e.g. "Mindful money") uses `--text-muted` and hides below the mobile breakpoint to keep the bar compact.

The header itself gets a `--surface-raised` background and a `--border` bottom divider, replacing the current hairline-only treatment. This gives the shell a clear "chrome" vs "content" contrast without introducing a drop shadow that reads heavy on small screens.

**Alternative considered:** sticky header. Rejected for v1 — it interacts with scroll anchoring on `/transactions` filter changes and isn't required by any spec.

### 3. Mobile breakpoint strategy

We standardize on **two breakpoints**:
- `max-width: 720px` (mobile / small tablet): stack-everything mode.
- `max-width: 1024px` (existing): the current font-size step and `h1`/`h2` ramps — leave as-is.

At `max-width: 720px`:
- `#root` loses its fixed 1126px width (already capped by `max-width: 100%`) and its inline border; page padding drops to `--space-3` so content doesn't hug edges.
- Nav becomes `overflow-x: auto` with `-webkit-overflow-scrolling: touch`; each link keeps its rounded background so the active state reads clearly on small screens.
- Account cards and dashboard grid cards go to single column (`grid-template-columns: 1fr`).
- Transaction rows across `WalletView`, `TransactionsView`, and `AccountDetail` collapse to a two-row block via `grid-template-areas`:
  ```
  "payee amount"
  "meta  meta"
  ```
  where `meta` joins category + account + date on one line separated by `·` (middle dot). This beats the current per-file `grid-template-columns: 1fr auto` repetitions and yields a consistent look.

**Alternative considered:** container queries. Rejected — we don't have container contexts set up, and the shell-width is the only meaningful axis today.

### 4. Amount coloring

Amounts currently render in the default text color regardless of sign. We add a tiny `.amount`-family selector set:
- `.amount--positive` → `var(--positive)`
- `.amount--negative` → `var(--negative)`
- Unsigned / neutral (e.g. balances) remain `var(--text-strong)`.

The feature layer decides the sign by inspecting `money.amount < 0n` (bigint compare) and applying the class. No domain change — `formatMoney` already emits `-` for negative bigints via `Intl.NumberFormat`.

**Alternative considered:** styling inside `formatMoney` (wrapping in a `<span>`). Rejected — `formatMoney` must stay a pure string function (spec `formatMoney renders minor-unit bigints without precision loss`); coloring is a view concern.

### 5. CSS organization

Feature CSS files stay co-located with their components; they just consume tokens instead of redeclaring values. `src/index.css` grows in scope but stays alone at the root — no global reset layer, no utility file, no `src/app/tokens.css` split. A single `:root` declaration is the easiest thing to reason about at this size.

We remove the few remaining hard-coded hex values (`#2f9e44`, `#c03636`, `rgba(127,127,127,0.25)`) and replace them with tokens.

### 6. Accessibility

- Focus-visible outlines on nav links, buttons, and card links (`outline: 2px solid var(--accent); outline-offset: 2px`) — currently the browser default, which is easy to lose on a themed surface.
- Confirm dark-mode pair for `--text-muted` against `--surface` hits ≥4.5:1. The existing `#9ca3af` on `#16171d` passes AA; adjust only if the new palette changes it.
- Minimum hit area: nav link padding bumps to `var(--space-2) var(--space-3)`; card links get `var(--space-3)` padding.

## Risks / Trade-offs

- **Visual regression** → mitigation: review each page in light and dark mode, and at 360/720/1200 widths before archiving. `npm run build` doesn't catch CSS regressions.
- **Token drift** → new tokens could be ignored by future features that reach for raw hex again. Mitigation: call this out in the archived spec's Purpose so the convention is discoverable.
- **Hard-coded `#root: 1126px` fights responsive styles** → mitigation is straightforward: keep the desktop width, but at the mobile breakpoint drop the `border-inline` and shrink padding. Risk is low because `max-width: 100%` already lets it shrink.
- **Positive/negative color semantics** → red-green pairing is not colorblind-friendly on its own. Mitigation: amounts keep their sign (`-`) in the string output from `formatMoney`, so color is an enhancement, not the only signal.
- **Browser support** → `:has()` is not used; `@media (prefers-color-scheme: dark)` and CSS custom properties are widely supported. No new browser-feature risk.

## Migration Plan

This is a stateless CSS-and-markup change. No data migration. Deploy is a single merge; rollback is a revert.

1. Land the token layer in `src/index.css` first (pure addition, existing rules unaffected).
2. Update the shell header (`Layout.tsx`, `Layout.css`, `Navigation.css`).
3. Sweep feature CSS to consume tokens and apply the mobile-stacking rules.
4. Manual QA at desktop (1440), tablet (768), mobile (360) in both schemes.
5. Merge. If a visual regression surfaces post-merge, revert the single commit.
