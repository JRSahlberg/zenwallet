import type { AccountId, TransactionId, WalletId } from "./ids";
import type { Currency, Money } from "./money";

export type Account = {
  id: AccountId;
  name: string;
  currency: Currency;
  archived: boolean;
  openingBalance: Money;
  createdAt: string;
};

export type Transaction = {
  id: TransactionId;
  accountId: AccountId;
  amount: Money;
  occurredAt: string;
  payee: string;
  category: string;
  memo?: string;
  voided: boolean;
};

export type Wallet = {
  id: WalletId;
  name: string;
  accounts: readonly Account[];
  transactions: readonly Transaction[];
};

export type DomainState = Wallet | null;
