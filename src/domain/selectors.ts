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
