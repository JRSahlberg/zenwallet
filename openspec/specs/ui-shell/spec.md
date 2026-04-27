## Purpose

Provide a consistent, semantic HTML shell with React Router v7 integration. The shell is presentational and domain-free, acting as the container for all application routes while maintaining proper landmark structure and navigation consistency.

## Requirements

### Requirement: App mounts a layout-wrapped router at the root

The system SHALL mount a single `RouterProvider` from `src/main.tsx` that renders a root `Layout` component wrapping a router outlet. The `Layout` SHALL render semantic `<header>`, `<nav>` (inside the header), `<main>`, and `<footer>` landmarks, with the outlet rendered inside `<main>`. The system SHALL NOT render the Vite starter `App` component anywhere.

#### Scenario: Visiting the app renders the shell chrome
- **WHEN** a user loads the app at any valid route
- **THEN** the rendered DOM contains exactly one `<header>`, one `<nav>`, one `<main>`, and one `<footer>` element provided by `Layout`, and the active route's content is rendered inside `<main>`

#### Scenario: The starter App component is removed
- **WHEN** a reviewer inspects `src/`
- **THEN** there is no file exporting a component named `App` derived from the Vite template, and no import of `./App` from `src/main.tsx`

### Requirement: Landing page is served at the root route

The system SHALL render a `Landing` page at path `/`. The landing page SHALL include a recognizable product heading (`<h1>` containing "ZenWallet") and at least one intro paragraph describing the app. The landing page SHALL be rendered inside the shell's `<main>` landmark, not outside the `Layout`.

#### Scenario: Landing renders at root
- **WHEN** a user navigates to `/`
- **THEN** the page inside `<main>` contains an `<h1>` with text "ZenWallet" and at least one `<p>` of intro copy

#### Scenario: Landing renders inside the shell
- **WHEN** the landing page is displayed
- **THEN** the shell's `<header>`, `<nav>`, and `<footer>` are also present on the page

### Requirement: Navigation lists top-level destinations from a single source

The system SHALL expose a typed `navDestinations` array in the routing module (`src/app/router.tsx`) of shape `{ to: string; label: string }[]`, and the `Navigation` component SHALL render one link per entry in that array. The system SHALL NOT maintain a separate list of nav items inside `Navigation` or any page component.

#### Scenario: Adding a destination updates the nav
- **WHEN** a developer adds a new entry `{ to: "/reports", label: "Reports" }` to `navDestinations` and a matching route to the router config
- **THEN** the rendered `<nav>` includes a link with text "Reports" pointing to `/reports` without any other code change

#### Scenario: Nav does not hardcode labels
- **WHEN** a reviewer inspects `Navigation.tsx`
- **THEN** its rendered links are produced by mapping over the imported `navDestinations` array, not by static JSX per destination

### Requirement: Active destination is indicated in the navigation

The system SHALL render navigation links using React Router's `NavLink` so that the link matching the current route has an active state. Active links SHALL have `aria-current="page"` set by the router, and SHALL receive a visually distinct style via an `active` class or equivalent selector.

#### Scenario: Active link at root
- **WHEN** a user is on `/`
- **THEN** the nav link whose `to` prop is `/` has `aria-current="page"` and renders with the active visual style

#### Scenario: Active link on a secondary route
- **WHEN** a user navigates to a secondary destination (e.g., `/app`) declared in `navDestinations`
- **THEN** only that link carries `aria-current="page"` and the active visual style; the root link does not

### Requirement: Unknown routes render a not-found page inside the shell

The system SHALL route any unmatched path to a `NotFound` page that renders inside the same `Layout` as the rest of the app. The `NotFound` page SHALL contain an `<h1>` with text "Not found" (case-insensitive match) and a link back to `/`.

#### Scenario: Unknown URL shows NotFound in the shell
- **WHEN** a user navigates to `/this-route-does-not-exist`
- **THEN** the rendered page contains the shell's `<header>`, `<nav>`, `<footer>`, and a `<main>` whose content includes an `<h1>` matching "not found" (case-insensitive) and an anchor pointing to `/`

### Requirement: UI shell is presentational and domain-free

The system SHALL keep the UI shell (`src/app/` and `src/pages/`) free of imports from `src/domain/`, free of storage or network access, and free of any stateful hooks beyond what React Router itself requires. The shell SHALL NOT call the domain reducer or any domain selectors.

#### Scenario: Shell imports
- **WHEN** a reviewer inspects every file under `src/app/` and `src/pages/`
- **THEN** no file contains an import from `../domain`, `./domain`, or any path under `src/domain/`, and no file performs `fetch`, `localStorage`, `sessionStorage`, `indexedDB`, or `Date.now()` calls

#### Scenario: No domain state in the shell
- **WHEN** a reviewer inspects the `Layout`, `Navigation`, `Landing`, and `NotFound` components
- **THEN** none of them call `useReducer`, `useState` holding domain data, or any hook from `src/domain/`

### Requirement: Index HTML reflects the product

The system SHALL set the `<title>` in `index.html` to `ZenWallet` (exact match, no trailing Vite boilerplate). The system SHALL NOT leave unused starter imports (e.g., `reactLogo`, `viteLogo`) in any file reachable from `src/main.tsx`.

#### Scenario: Title is ZenWallet
- **WHEN** a reviewer loads `index.html`
- **THEN** the `<title>` element contains exactly `ZenWallet`

#### Scenario: Starter logo imports are gone
- **WHEN** a reviewer greps the `src/` tree for `reactLogo`, `viteLogo`, or `./assets/react.svg`
- **THEN** no matches are found in any file reachable from `src/main.tsx`

### Requirement: Header renders a product brand block

The system SHALL render, inside the shell `<header>` and as a sibling of `<nav>`, a brand block containing an `<a>` pointing to `/` whose accessible name contains `"ZenWallet"`. The brand block SHALL include the wordmark text `"ZenWallet"` (rendered in `--text-strong`) and a tagline element (e.g. a `<span>` or `<p>` sibling of the wordmark) whose text is non-empty and rendered in `--text-muted`. The brand block SHALL appear to the left of the navigation in source order so that keyboard tab order reaches the brand before the nav links.

#### Scenario: Brand block exists inside the header
- **WHEN** a reviewer inspects the rendered DOM of the shell at any route
- **THEN** the single `<header>` contains exactly one brand block with an `<a>` whose `href` resolves to `/` and whose accessible name contains `"ZenWallet"`, and the `<header>` also still contains exactly one `<nav>` element

#### Scenario: Wordmark and tagline are present
- **WHEN** a reviewer inspects the brand block
- **THEN** it contains an element whose text is exactly `"ZenWallet"` and a sibling element whose text is a non-empty string distinct from `"ZenWallet"`

#### Scenario: Brand precedes nav in source order
- **WHEN** a reviewer inspects the children of the shell `<header>`
- **THEN** the brand block appears before `<nav>` in document order

### Requirement: Shell adapts to narrow viewports without horizontal overflow

The system SHALL, at viewport widths of 360px and above, render the shell so that the document body's `scrollWidth` does not exceed the viewport's `clientWidth` (i.e. no horizontal page scroll is introduced by the shell chrome). At viewport widths at or below 720px, the navigation SHALL allow horizontal scrolling within itself (e.g. `overflow-x: auto` on `<nav>` or its list) so that more nav entries than fit on one line remain reachable without wrapping the header to a second line, and the root container's inline borders SHALL be removed so page padding remains consistent.

#### Scenario: No horizontal page scroll at 360px
- **WHEN** the app is rendered at a viewport width of 360px (any route)
- **THEN** `document.documentElement.scrollWidth` equals `document.documentElement.clientWidth` (no horizontal page scroll)

#### Scenario: Nav scrolls horizontally when it overflows
- **WHEN** the viewport is at or below 720px and `navDestinations` contains more entries than fit on one line in the header
- **THEN** the `<nav>` (or the `<ul>` inside it) has a computed `overflow-x` of `auto` or `scroll`, and the header remains on a single line

#### Scenario: Root container drops inline borders on mobile
- **WHEN** the viewport is at or below 720px
- **THEN** the `#root` element has no visible left or right border (computed `border-left-width` and `border-right-width` are `0px`)

### Requirement: Interactive shell elements have a visible focus state

The system SHALL ensure that navigation links and the brand link render a visible focus indicator when focused via keyboard (`:focus-visible`). The indicator SHALL be distinct from the element's default (unfocused) appearance and SHALL NOT rely solely on the user-agent default outline being preserved (an explicit `outline` or equivalent style is required so theming does not erase it).

#### Scenario: Nav link shows focus ring
- **WHEN** a user tabs to a nav link via the keyboard
- **THEN** the focused link renders a visible focus indicator distinct from its idle state (e.g. a non-zero `outline-width` with a color from the theme palette)

#### Scenario: Brand link shows focus ring
- **WHEN** a user tabs to the brand link via the keyboard
- **THEN** the focused link renders a visible focus indicator equivalent in contrast and size to the nav link's focus indicator
