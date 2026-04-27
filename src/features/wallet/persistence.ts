import type { Account, DomainState, Transaction, Wallet } from "../../domain";

export const STORAGE_KEY = "zenwallet:v1";
const ENVELOPE_VERSION = 1;

type Envelope = { v: number; state: unknown };
type BigIntTag = { $bigint: string };

function isBigIntTag(value: unknown): value is BigIntTag {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof (value as Record<string, unknown>).$bigint === "string"
  );
}

function serialize(value: unknown): unknown {
  if (typeof value === "bigint") {
    return { $bigint: value.toString() };
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serialize(v);
    }
    return out;
  }
  return value;
}

function deserialize(value: unknown): unknown {
  if (isBigIntTag(value)) {
    return BigInt(value.$bigint);
  }
  if (Array.isArray(value)) {
    return value.map(deserialize);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deserialize(v);
    }
    return out;
  }
  return value;
}

function isValidAccount(value: unknown): value is Account {
  if (value === null || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.id === "string" &&
    typeof a.name === "string" &&
    typeof a.currency === "string" &&
    typeof a.archived === "boolean" &&
    typeof a.createdAt === "string" &&
    isValidMoney(a.openingBalance)
  );
}

function isValidMoney(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return typeof m.amount === "bigint" && typeof m.currency === "string";
}

function isValidTransaction(value: unknown): value is Transaction {
  if (value === null || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.accountId === "string" &&
    typeof t.occurredAt === "string" &&
    typeof t.payee === "string" &&
    typeof t.category === "string" &&
    typeof t.voided === "boolean" &&
    (t.memo === undefined || typeof t.memo === "string") &&
    isValidMoney(t.amount)
  );
}

function isValidWallet(value: unknown): value is Wallet {
  if (value === null || typeof value !== "object") return false;
  const w = value as Record<string, unknown>;
  if (typeof w.id !== "string") return false;
  if (typeof w.name !== "string") return false;
  if (!Array.isArray(w.accounts)) return false;
  if (!Array.isArray(w.transactions)) return false;
  if (!w.accounts.every(isValidAccount)) return false;
  if (!w.transactions.every(isValidTransaction)) return false;
  return true;
}

export function loadWalletState(): DomainState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    console.warn("ZenWallet: localStorage read failed; starting fresh.");
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn("ZenWallet: saved state is not valid JSON; discarding.");
    return null;
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    (parsed as Envelope).v !== ENVELOPE_VERSION
  ) {
    console.warn(
      "ZenWallet: saved state has unknown schema version; discarding.",
    );
    return null;
  }

  const envelope = parsed as Envelope;
  if (envelope.state === null) return null;

  let decoded: unknown;
  try {
    decoded = deserialize(envelope.state);
  } catch {
    console.warn("ZenWallet: saved state could not be decoded; discarding.");
    return null;
  }

  if (!isValidWallet(decoded)) {
    console.warn(
      "ZenWallet: saved state failed shape validation; discarding.",
    );
    return null;
  }

  return decoded;
}

export function saveWalletState(state: DomainState): void {
  try {
    const envelope: Envelope = {
      v: ENVELOPE_VERSION,
      state: serialize(state),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage may be unavailable (quota, private mode). Swallow silently to
    // avoid breaking the UI on every dispatch.
  }
}
