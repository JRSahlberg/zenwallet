## ADDED Requirements

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
