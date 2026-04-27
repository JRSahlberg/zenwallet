# ZenWallet

ZenWallet is a lightweight personal finance app prototype built with **React 19**, **TypeScript**, and **Vite**.

The project was created as a hands-on exploration of **spec-driven development** using **OpenSpec** and AI-assisted implementation workflows. It demonstrates how structured specs can be translated into working software through iterative planning and code generation.

---

## Current Features

### Wallet Dashboard

* Multi-currency wallet overview
* Net worth summary by currency
* Monthly income and expense snapshot
* Top spending category
* Account summary cards
* Recent transactions panel

### Transactions

* Add income and expense transactions
* Required field validation
* Category-based organization
* Search transactions by payee or memo
* Filter by account or category
* Newest-first transaction history

### Accounts

* Account list with balances
* Account detail view
* Recent activity per account
* Archived accounts shown with a badge (still contribute to totals)

### Persistence

* Automatic save to `localStorage` (bigint-safe JSON codec)
* State restored on page refresh
* Demo wallet available for first-time use

### UI & Responsive Design

* Semantic design-token layer (color, spacing, radius, shadow, type scale)
* Branded header with wordmark + tagline; tagline collapses on mobile
* Automatic dark mode via `prefers-color-scheme`, tuned for WCAG AA contrast
* Mobile-first layout at ≤ 720px: single-column card grids, two-row transaction rows, horizontally-scrolling nav, stacked filters
* Sign-colored amounts (positive / negative / neutral) across every transaction view
* Visible focus rings on nav, brand, form controls, and account cards

---

## Tech Stack

* React 19
* TypeScript
* Vite
* React Router
* OpenSpec workflow
* Pure TypeScript domain layer

---

## Project Structure

```text
src/
  app/        # Shell, layout, navigation, routes
  pages/      # Route pages
  features/   # UI features connected to domain logic
  domain/     # Pure business logic and reducers
  main.tsx    # App bootstrap
openspec/     # Specs, proposals, tasks
```

---

## Architecture Notes

ZenWallet separates UI from business logic:

* **UI Shell** handles layout, navigation, and routes
* **Feature Layer** connects React components to state and domain logic
* **Domain Layer** contains pure, framework-free logic for:

  * wallets
  * accounts
  * transactions
  * balances
  * money handling

This keeps core logic reusable and easier to test or migrate later.

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## Future Improvements

If development continued, logical next steps would include:

### Product

* Create and edit accounts
* Edit / void transactions
* Transfers between accounts
* Recurring transactions
* Budgets and goals
* CSV import/export

### Insights

* Spending charts
* Trend reports
* Category analytics
* Budget alerts

### UX

* Manual theme switcher (override `prefers-color-scheme`)
* Better onboarding flow for first-time users
* Deeper accessibility pass (keyboard shortcuts, reduced-motion variants, screen-reader audit)

### Engineering

* Automated tests
* IndexedDB or backend sync
* Authentication
* Multi-device support

---

## Purpose

This repository is primarily a **lab / prototype project** demonstrating how modern AI-assisted workflows can rapidly build a functional MVP from structured specifications.

It is not intended as a production-ready financial platform, but it provides a foundation for one.
