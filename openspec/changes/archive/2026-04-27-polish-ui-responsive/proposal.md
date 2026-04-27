## Why

ZenWallet's UI ships feature-complete screens but looks like a prototype: anemic color palette, flat visual hierarchy, cramped spacing, and transaction rows that collapse awkwardly on narrow viewports. The header has no brand identity — just a nav bar. Before we add more feature surface, we want a confident, branded look that reads well on phones and establishes the visual language the rest of the app will inherit.

## What Changes

- Introduce a richer **design-token layer** in `src/index.css`: a semantic palette (surface / surface-raised / text / text-muted / accent / positive / negative / border), a spacing scale (`--space-1…6`), a radius scale, and a typographic scale. Dark mode tokens tuned for WCAG AA contrast.
- Upgrade the **shell header** to a branded bar with a `ZenWallet` wordmark and accent mark on the left, navigation on the right, and a subtle surface color that separates it from the page.
- Tighten **page-level spacing**: consistent vertical rhythm between hero/heading/grid blocks, and consistent card padding using the spacing scale.
- Polish **transaction rows** (wallet dashboard, transactions view, account detail) with clearer typographic hierarchy (payee prominent, category/account muted, amount right-aligned with positive/negative color), signed-amount coloring, and divider treatment.
- **Mobile card stacking**: at narrow widths, transaction rows collapse to a two-row block (payee + amount on top, category/account/date on the bottom) and account cards stack full-width with equal gutters; nav becomes a horizontally-scrollable row.
- Net-worth / totals blocks become **display cards** with a clear "Net worth" eyebrow label and prominent per-currency amounts.
- Touch-friendly targets: nav links, cards, and buttons meet a 44px minimum hit area on mobile.

No domain-layer changes. No new dependencies. No behavior changes to the wallet reducer, selectors, or routing.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `ui-shell`: adds a branded-header requirement (wordmark + tagline) and a responsive-layout requirement (nav and main content adapt gracefully to narrow viewports); existing semantic-landmark, navigation, and not-found requirements are unchanged.
- `wallet-list-view`: adds a requirement that dashboard cards stack full-width below the mobile breakpoint and that transaction-like rows collapse to a two-row layout; existing data-contract requirements (balance source, totals source, format) are unchanged.
- `transactions-view`: adds a requirement that rows collapse to a two-row block below the mobile breakpoint and that amounts render with positive/negative color; existing filtering and data-source requirements are unchanged.
- `accounts-view`: adds a requirement that the account list stacks full-width on mobile and that the net-worth header remains readable on narrow viewports; existing net-worth-source, card-content, and detail-view requirements are unchanged.

## Impact

- **Code**: `src/index.css` (token layer), `src/app/Layout.{tsx,css}` (branded header), `src/app/Navigation.css` (responsive nav, active-state polish), `src/pages/Landing.css` (hero spacing), `src/features/wallet/WalletView.css`, `src/features/wallet/TransactionsView.css`, `src/features/wallet/AccountsView.css`, and the relevant `.tsx` files only if new class hooks are needed (no structural JSX changes expected beyond the header markup).
- **APIs / dependencies**: none. No `package.json` changes.
- **Design tokens**: the new CSS custom properties become the app's shared vocabulary. Feature styles must consume tokens rather than hard-coded colors or px values going forward.
- **Risk**: purely presentational. Regression risk is visual; unit/type checks are unaffected. Dark-mode contrast and small-screen layout need manual verification.
