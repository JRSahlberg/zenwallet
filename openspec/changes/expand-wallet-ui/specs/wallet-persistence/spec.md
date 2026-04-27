## ADDED Requirements

### Requirement: Wallet state is persisted to localStorage on every change

The system SHALL expose `saveWalletState(state: DomainState): void` and `loadWalletState(): DomainState` from `src/features/wallet/persistence.ts`. `WalletStoreProvider` SHALL subscribe to its own state via `useEffect` and call `saveWalletState(state)` on every state change (including when the state transitions to `null`). The save SHALL write under a single, stable localStorage key (e.g. `"zenwallet:v1"`).

#### Scenario: Saving a newly created wallet
- **WHEN** the provider dispatches `wallet/create` against `null` state and the effect runs
- **THEN** the localStorage key contains a serialized envelope carrying the new `Wallet` and no other entry in localStorage is written by the app

#### Scenario: Saving after every subsequent change
- **WHEN** the provider dispatches `account/add`, `transaction/post`, or `transaction/void` in sequence
- **THEN** the localStorage key is rewritten after each dispatch and always reflects the latest post-reducer state

#### Scenario: Save is triggered by state transitions to null
- **WHEN** a future action causes state to become `null` (e.g. a reset action, if added later)
- **THEN** the localStorage key is updated to reflect the cleared state rather than left stale

### Requirement: Wallet state is rehydrated on startup

The system SHALL initialize the reducer with `loadWalletState()` at provider construction time, so that the first render of every route observes the persisted wallet (if any). The loader SHALL wrap localStorage access in try/catch and return `null` on any failure (missing key, `SecurityError`, `QuotaExceededError` during a test read, JSON parse error).

#### Scenario: Rehydrating a previously saved wallet
- **WHEN** the localStorage key holds a valid envelope from a prior session and the app boots
- **THEN** the first render of any route observes a non-null `state` equal to the previously saved `Wallet`, and the empty-state + demo-seed UI is not shown

#### Scenario: First-run with no saved state
- **WHEN** no localStorage key exists and the app boots
- **THEN** `loadWalletState()` returns `null` without throwing, and the wallet view renders the empty state + "Create demo wallet" button

#### Scenario: localStorage throws on read
- **WHEN** accessing localStorage throws (e.g. privacy mode denies access)
- **THEN** `loadWalletState()` catches the error, returns `null`, and the app continues to render normally

### Requirement: Persistence codec preserves bigint amounts exactly

The system SHALL serialize and deserialize `DomainState` using a codec that represents every `bigint` value as `{ "$bigint": "<decimal-digits>" }` and reverses the shape on read. The codec SHALL NOT apply `Number(bigint)` to any monetary amount. The codec SHALL wrap the payload in an envelope of shape `{ v: 1, state: <encoded-state> }` so schema version is recoverable on load.

#### Scenario: Round-tripping a large amount
- **WHEN** a wallet contains a transaction with `amount: { amount: 12345678901234567890n, currency: "USD" }` and is saved then loaded
- **THEN** after rehydrate the same transaction's `amount.amount` is `12345678901234567890n` as a `bigint`, bit-for-bit equal to the original

#### Scenario: Envelope records schema version
- **WHEN** a wallet is saved for the first time
- **THEN** the raw localStorage string parses to an object whose top-level keys include `v` with value `1` and `state` with the encoded domain state

#### Scenario: Codec never calls Number() on amounts
- **WHEN** a reviewer inspects `persistence.ts`
- **THEN** no call to `Number(...)`, `parseFloat(...)`, or arithmetic coercion is applied to a `bigint` amount; bigints are only read or written via the `{ $bigint: string }` shape

### Requirement: Unknown or invalid payloads are dropped with a single warning

The system SHALL treat a payload whose envelope version is not `1`, whose JSON fails to parse, or whose structural validation fails (missing required fields on `Account` or `Transaction` — including the new `payee` and `category` fields on transactions) as unrecoverable. In that case `loadWalletState()` SHALL return `null` and the system SHALL emit exactly one `console.warn` per page load explaining the state was discarded.

#### Scenario: Corrupt JSON is dropped
- **WHEN** the localStorage key holds the literal string `"not-json"` and the app boots
- **THEN** `loadWalletState()` returns `null`, one `console.warn` is emitted, and the app continues to render the empty state

#### Scenario: Wrong schema version is dropped
- **WHEN** the localStorage key holds `{ "v": 99, "state": {...} }`
- **THEN** `loadWalletState()` returns `null` and one `console.warn` is emitted; the `v: 1` branch is not executed

#### Scenario: Missing new transaction fields force a reset
- **WHEN** the localStorage key holds a `v: 1` envelope whose transactions lack `payee` or `category`
- **THEN** `loadWalletState()` returns `null` and one `console.warn` is emitted, and the next render seeds a fresh demo wallet on user action

### Requirement: Persistence module stays inside the feature layer

The system SHALL place all localStorage access under `src/features/wallet/persistence.ts` (plus its call site inside `src/features/wallet/store.tsx`). No file under `src/domain/`, `src/app/`, or `src/pages/` SHALL read or write `localStorage`, `sessionStorage`, or `indexedDB`.

#### Scenario: Storage access is confined to the feature module
- **WHEN** a reviewer greps every file under `src/` for `localStorage`, `sessionStorage`, or `indexedDB`
- **THEN** matches are found only in `src/features/wallet/persistence.ts` and `src/features/wallet/store.tsx`
