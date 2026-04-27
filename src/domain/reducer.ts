import { DomainError } from "./errors";
import type { AccountId, TransactionId, WalletId } from "./ids";
import { sameCurrency } from "./money";
import type { Currency, Money } from "./money";
import type { Account, DomainState, Transaction, Wallet } from "./types";

export type Action =
  | { type: "wallet/create"; id: WalletId; name: string }
  | {
      type: "account/add";
      accountId: AccountId;
      name: string;
      currency: Currency;
      openingBalance: Money;
      createdAt: string;
    }
  | { type: "account/rename"; accountId: AccountId; name: string }
  | { type: "account/archive"; accountId: AccountId }
  | {
      type: "transaction/post";
      accountId: AccountId;
      transactionId: TransactionId;
      amount: Money;
      occurredAt: string;
      payee: string;
      category: string;
      memo?: string;
    }
  | { type: "transaction/void"; transactionId: TransactionId };

export function walletReducer(
  state: DomainState,
  action: Action,
): DomainState {
  if (action.type === "wallet/create") {
    if (state !== null) {
      throw new DomainError("WALLET_ALREADY_EXISTS");
    }
    const fresh: Wallet = {
      id: action.id,
      name: action.name,
      accounts: [],
      transactions: [],
    };
    return fresh;
  }

  if (state === null) {
    throw new DomainError("NO_WALLET");
  }

  switch (action.type) {
    case "account/add":
      return addAccount(state, action);
    case "account/rename":
      return renameAccount(state, action);
    case "account/archive":
      return archiveAccount(state, action);
    case "transaction/post":
      return postTransaction(state, action);
    case "transaction/void":
      return voidTransaction(state, action);
    default:
      return assertNever(action);
  }
}

function addAccount(
  wallet: Wallet,
  action: Extract<Action, { type: "account/add" }>,
): Wallet {
  if (wallet.accounts.some((a) => a.id === action.accountId)) {
    throw new DomainError("DUPLICATE_ID", `account ${action.accountId}`);
  }
  if (!sameCurrency(action.openingBalance, { amount: 0n, currency: action.currency })) {
    throw new DomainError(
      "CURRENCY_MISMATCH",
      `account currency ${action.currency} vs opening ${action.openingBalance.currency}`,
    );
  }
  const account: Account = {
    id: action.accountId,
    name: action.name,
    currency: action.currency,
    archived: false,
    openingBalance: action.openingBalance,
    createdAt: action.createdAt,
  };
  return { ...wallet, accounts: [...wallet.accounts, account] };
}

function renameAccount(
  wallet: Wallet,
  action: Extract<Action, { type: "account/rename" }>,
): Wallet {
  const target = wallet.accounts.find((a) => a.id === action.accountId);
  if (!target) {
    throw new DomainError("UNKNOWN_ACCOUNT", action.accountId);
  }
  return {
    ...wallet,
    accounts: wallet.accounts.map((a) =>
      a.id === action.accountId ? { ...a, name: action.name } : a,
    ),
  };
}

function archiveAccount(
  wallet: Wallet,
  action: Extract<Action, { type: "account/archive" }>,
): Wallet {
  const target = wallet.accounts.find((a) => a.id === action.accountId);
  if (!target) {
    throw new DomainError("UNKNOWN_ACCOUNT", action.accountId);
  }
  return {
    ...wallet,
    accounts: wallet.accounts.map((a) =>
      a.id === action.accountId ? { ...a, archived: true } : a,
    ),
  };
}

function postTransaction(
  wallet: Wallet,
  action: Extract<Action, { type: "transaction/post" }>,
): Wallet {
  const account = wallet.accounts.find((a) => a.id === action.accountId);
  if (!account) {
    throw new DomainError("UNKNOWN_ACCOUNT", action.accountId);
  }
  if (account.archived) {
    throw new DomainError("ACCOUNT_ARCHIVED", action.accountId);
  }
  if (action.amount.currency !== account.currency) {
    throw new DomainError(
      "CURRENCY_MISMATCH",
      `account ${account.currency} vs tx ${action.amount.currency}`,
    );
  }
  if (wallet.transactions.some((t) => t.id === action.transactionId)) {
    throw new DomainError("DUPLICATE_ID", `transaction ${action.transactionId}`);
  }
  if (action.payee.trim() === "") {
    throw new DomainError("MISSING_PAYEE");
  }
  if (action.category.trim() === "") {
    throw new DomainError("MISSING_CATEGORY");
  }
  const tx: Transaction = {
    id: action.transactionId,
    accountId: action.accountId,
    amount: action.amount,
    occurredAt: action.occurredAt,
    payee: action.payee,
    category: action.category,
    memo: action.memo,
    voided: false,
  };
  return { ...wallet, transactions: [...wallet.transactions, tx] };
}

function voidTransaction(
  wallet: Wallet,
  action: Extract<Action, { type: "transaction/void" }>,
): Wallet {
  const target = wallet.transactions.find((t) => t.id === action.transactionId);
  if (!target) {
    throw new DomainError("UNKNOWN_TRANSACTION", action.transactionId);
  }
  if (target.voided) {
    throw new DomainError("ALREADY_VOIDED", action.transactionId);
  }
  return {
    ...wallet,
    transactions: wallet.transactions.map((t) =>
      t.id === action.transactionId ? { ...t, voided: true } : t,
    ),
  };
}

function assertNever(x: never): never {
  throw new DomainError(
    "NO_WALLET",
    `unreachable action: ${JSON.stringify(x)}`,
  );
}
