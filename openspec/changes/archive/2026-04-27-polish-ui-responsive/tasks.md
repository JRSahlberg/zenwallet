## 1. Design tokens

- [x] 1.1 Extend `:root` in `src/index.css` with the semantic color set (`--surface`, `--surface-raised`, `--surface-sunken`, `--text-strong`, `--text-muted`, `--accent-strong`, `--accent-soft`, `--positive`, `--positive-soft`, `--negative`, `--negative-soft`, `--border-strong`), keeping the existing `--text`, `--bg`, `--border`, `--accent`, `--accent-bg` names as aliases/backward-compatible values for any unswept consumers.
- [x] 1.2 Add spacing, radius, shadow, and type-scale tokens (`--space-1` … `--space-6`, `--radius-sm/md/lg/pill`, `--shadow-sm/md`, `--font-size-eyebrow/body/title`) to `:root`.
- [x] 1.3 Mirror every new color token in the `@media (prefers-color-scheme: dark)` block and verify each `--text` / `--text-muted` pair hits ≥ 4.5:1 contrast against `--surface` and `--surface-raised` (use a contrast checker once per pair).
- [x] 1.4 Replace hard-coded hex values (`#2f9e44`, `#c03636`) and `rgba(127,127,127,...)` literals across feature CSS files with the new tokens; grep for `rgba(127` and `#[0-9a-f]{6}` under `src/` to confirm none remain outside `src/index.css`.

## 2. Branded shell header

- [x] 2.1 Add a `Brand` element in `src/app/Layout.tsx` rendering a `<Link to="/">` with a `<span>` wordmark (`ZenWallet`) and a tagline `<span>` (e.g. `Mindful money`), both using semantic tokens. Preserve the existing `<Navigation />` placement inside `<header>`; ensure the brand precedes nav in source order.
- [x] 2.2 Update `src/app/Layout.css` to lay out the header as `display: flex; align-items: center; gap: var(--space-3); justify-content: space-between;` and give the header a `background: var(--surface-raised)` with a `--border` bottom divider.
- [x] 2.3 Hide the tagline at viewport widths at or below 720px while keeping the wordmark visible; keep the brand link tap target at ≥ 44px on mobile.
- [x] 2.4 Add a `:focus-visible` outline rule on the brand link and nav links using `--accent` with `outline-offset: 2px`, so focus indicators survive the header's new surface color.

## 3. Responsive shell

- [x] 3.1 In `src/index.css`, at `@media (max-width: 720px)` set `#root { border-inline: 0; padding-inline: var(--space-3); }` and reduce the page-level `h1`/`h2` vertical margins to the spacing scale.
- [x] 3.2 In `src/app/Navigation.css`, add `@media (max-width: 720px) nav ul { overflow-x: auto; flex-wrap: nowrap; scrollbar-width: thin; }` and ensure `nav li` children don't shrink (`flex-shrink: 0`).
- [x] 3.3 Verify at 360px width that `document.documentElement.scrollWidth === clientWidth` across all routes (landing, wallet, transactions, accounts, account detail, add).

## 4. Dashboard (`/wallet`) polish

- [x] 4.1 Rewrite `.wallet-view__grid` to use the spacing scale (`gap: var(--space-3)`) and update `.dashboard-card` padding/border to use tokens; drop the hard-coded `8px` / `1rem` values.
- [x] 4.2 At `@media (max-width: 720px)` collapse `.wallet-view__grid` to `grid-template-columns: 1fr` so every card takes full width.
- [x] 4.3 Convert `.dashboard-card__recent-row` to a `grid-template-areas` layout: on desktop, one row `"payee category account date amount"`; on mobile, two rows `"payee amount" / "meta meta"` with category/account/date joined into a single `.dashboard-card__recent-meta` span in the JSX (add the class hook; no structural change beyond wrapping three sibling fields).
- [x] 4.4 In `src/features/wallet/WalletView.tsx` (and any dashboard cards under `src/features/wallet/dashboard/`), compute a sign class (`amount--positive` / `amount--negative` / neutral) from each transaction's `amount.amount` bigint and apply it to the amount element; do not change `formatMoney` output.
- [x] 4.5 Add `.amount--positive { color: var(--positive); }` and `.amount--negative { color: var(--negative); }` rules (once, in `src/index.css` or a shared feature stylesheet) and remove the inline green/red literals.
- [x] 4.6 Apply the same sign-class treatment to month-to-date income/expense rows (`.dashboard-card__month-income` / `--month-expense`), replacing their hard-coded colors with the token-driven classes.

## 5. Transactions view (`/transactions`) polish

- [x] 5.1 Update `src/features/wallet/TransactionsView.css` to consume spacing/radius/color tokens for filter controls and row dividers; ensure `:focus-visible` styles for `<select>` and `<input>` use `--accent`.
- [x] 5.2 Rewrite `.transactions-view__row` desktop grid with `grid-template-areas` so the mobile variant can reuse the named areas; verify desktop still renders on a single line.
- [x] 5.3 At `@media (max-width: 720px)` (replacing the current `480px` block) collapse the row to a two-row block via `grid-template-areas: "payee amount" "meta meta"`; wrap category + account + date in a single `.transactions-view__meta` span in the JSX (join with a middle-dot or equivalent separator).
- [x] 5.4 At `@media (max-width: 720px)` stack `.transactions-view__filters` children (`flex-direction: column`) so each filter takes full width.
- [x] 5.5 In `TransactionsView.tsx`, apply the sign color class to each row amount using the same helper introduced in 4.4.

## 6. Accounts (`/accounts` + detail) polish

- [x] 6.1 In `src/features/wallet/AccountsView.css`, switch `.accounts-view__list` grid gutters and card padding to the spacing scale; remove the static `220px` `minmax` floor in favor of `minmax(min(100%, 260px), 1fr)` so cards stretch properly on narrow tablets.
- [x] 6.2 At `@media (max-width: 720px)` set `.accounts-view__list { grid-template-columns: 1fr; }` and stack `.accounts-header__networth` so the eyebrow label (`Net worth`) sits on its own line above the per-currency list.
- [x] 6.3 Ensure `.accounts-header__networth` has no horizontal overflow at 360px by allowing the `<ul>` to wrap (`flex-wrap: wrap`) and applying `min-width: 0` where needed.
- [x] 6.4 In `src/features/wallet/AccountDetail.tsx`, apply the shared sign color class to each recent-transaction row's amount and keep the balance heading neutral (no sign class).
- [x] 6.5 Collapse `.account-detail__row` to the same two-row mobile layout via `grid-template-areas`, mirroring the transactions view.

## 7. Landing and add-transaction polish

- [x] 7.1 Update `src/pages/Landing.css` spacing and heading margins to use the new scale; audit the landing CTA (if any) for the 44px touch-target rule.
- [x] 7.2 Sweep `src/features/wallet/AddTransactionForm.css` to consume tokens for inputs/labels and apply focus styles consistent with the rest of the app.

## 8. Verification

- [x] 8.1 `npm run lint` passes.
- [x] 8.2 `npm run build` passes (type-check + production bundle).
- [x] 8.3 Manual QA at 360px, 720px, 1024px, and 1440px in both light and dark modes across `/`, `/wallet`, `/transactions`, `/accounts`, `/accounts/:id`, `/add`, and an unknown URL — verify no horizontal overflow, branded header visible, amounts colored correctly, and nav active state reads clearly.
- [x] 8.4 Grep confirms no hard-coded hex colors or `rgba(127,127,127,...)` values outside `src/index.css`, and no raw pixel spacing outside the token layer in feature CSS (a light sweep, not an absolute ban on `0.25rem`-style fractional values).
- [x] 8.5 Run `openspec validate polish-ui-responsive --strict`.
