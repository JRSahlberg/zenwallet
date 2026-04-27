import { DomainError } from "./errors";
import type { AccountId } from "./ids";
import { addMoney } from "./money";
import type { Currency, Money } from "./money";
import type { Transaction, Wallet } from "./types";

export function balanceOfAccount(wallet: Wallet, accountId: AccountId): Money {
  const account = wallet.accounts.find((a) => a.id === accountId);
  if (!account) {
    throw new DomainError("UNKNOWN_ACCOUNT", accountId);
  }
  let balance: Money = account.openingBalance;
  for (const tx of wallet.transactions) {
    if (tx.accountId === accountId && !tx.voided) {
      balance = addMoney(balance, tx.amount);
    }
  }
  return balance;
}

export function transactionsForAccount(
  wallet: Wallet,
  accountId: AccountId,
): readonly Transaction[] {
  return wallet.transactions.filter((t) => t.accountId === accountId);
}

export function walletTotals(wallet: Wallet): Record<Currency, bigint> {
  const totals: Record<Currency, bigint> = {};
  for (const account of wallet.accounts) {
    const balance = balanceOfAccount(wallet, account.id);
    const prev = totals[balance.currency] ?? 0n;
    totals[balance.currency] = prev + balance.amount;
  }
  return totals;
}

export type MonthlyTotalEntry = {
  currency: Currency;
  income: bigint;
  expense: bigint;
};

export function monthlyTotals(
  wallet: Wallet,
  start: string,
  endExclusive: string,
): MonthlyTotalEntry[] {
  const byCurrency = new Map<Currency, { income: bigint; expense: bigint }>();
  for (const tx of wallet.transactions) {
    if (tx.voided) continue;
    if (tx.occurredAt < start || tx.occurredAt >= endExclusive) continue;
    const entry = byCurrency.get(tx.amount.currency) ?? {
      income: 0n,
      expense: 0n,
    };
    if (tx.amount.amount > 0n) {
      entry.income += tx.amount.amount;
    } else if (tx.amount.amount < 0n) {
      entry.expense += -tx.amount.amount;
    }
    byCurrency.set(tx.amount.currency, entry);
  }
  const out: MonthlyTotalEntry[] = [];
  for (const [currency, { income, expense }] of byCurrency) {
    out.push({ currency, income, expense });
  }
  return out;
}

export function topSpendingCategory(
  wallet: Wallet,
  start: string,
  endExclusive: string,
  currency: Currency,
): { category: string; total: bigint } | null {
  const byCategory = new Map<string, bigint>();
  for (const tx of wallet.transactions) {
    if (tx.voided) continue;
    if (tx.amount.currency !== currency) continue;
    if (tx.occurredAt < start || tx.occurredAt >= endExclusive) continue;
    if (tx.amount.amount >= 0n) continue;
    const prev = byCategory.get(tx.category) ?? 0n;
    byCategory.set(tx.category, prev + -tx.amount.amount);
  }
  let best: { category: string; total: bigint } | null = null;
  for (const [category, total] of byCategory) {
    if (best === null) {
      best = { category, total };
      continue;
    }
    if (total > best.total) {
      best = { category, total };
    } else if (total === best.total && category < best.category) {
      best = { category, total };
    }
  }
  return best;
}
