import { newId } from "../../domain";
import type {
  AccountId,
  Action,
  TransactionId,
  WalletId,
} from "../../domain";

export function buildDemoActions(): Action[] {
  const walletId = newId<WalletId>();
  const checkingId = newId<AccountId>();
  const travelId = newId<AccountId>();
  const tx1Id = newId<TransactionId>();
  const tx2Id = newId<TransactionId>();
  const tx3Id = newId<TransactionId>();
  const now = new Date().toISOString();

  return [
    { type: "wallet/create", id: walletId, name: "Demo Wallet" },
    {
      type: "account/add",
      accountId: checkingId,
      name: "Checking",
      currency: "USD",
      openingBalance: { amount: 100000n, currency: "USD" },
      createdAt: now,
    },
    {
      type: "account/add",
      accountId: travelId,
      name: "Travel",
      currency: "EUR",
      openingBalance: { amount: 50000n, currency: "EUR" },
      createdAt: now,
    },
    {
      type: "transaction/post",
      accountId: checkingId,
      transactionId: tx1Id,
      amount: { amount: 2500n, currency: "USD" },
      occurredAt: now,
      memo: "Coffee shop",
    },
    {
      type: "transaction/post",
      accountId: travelId,
      transactionId: tx2Id,
      amount: { amount: 12000n, currency: "EUR" },
      occurredAt: now,
      memo: "Train ticket",
    },
    {
      type: "transaction/post",
      accountId: checkingId,
      transactionId: tx3Id,
      amount: { amount: 7500n, currency: "USD" },
      occurredAt: now,
      memo: "Groceries",
    },
    { type: "transaction/void", transactionId: tx2Id },
  ];
}
