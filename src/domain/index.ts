export { DomainError } from "./errors";
export type { DomainErrorCode } from "./errors";

export { newId } from "./ids";
export type { AccountId, TransactionId, WalletId } from "./ids";

export {
  addMoney,
  negateMoney,
  sameCurrency,
  zeroMoney,
} from "./money";
export type { Currency, Money, SupportedCurrency } from "./money";

export type { Account, DomainState, Transaction, Wallet } from "./types";

export { walletReducer } from "./reducer";
export type { Action } from "./reducer";

export {
  balanceOfAccount,
  monthlyTotals,
  topSpendingCategory,
  transactionsForAccount,
  walletTotals,
} from "./selectors";
export type { MonthlyTotalEntry } from "./selectors";
