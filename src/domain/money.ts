import { DomainError } from "./errors";

export type SupportedCurrency = "USD" | "EUR" | "GBP" | "SEK" | "JPY";
export type Currency = string;

export type Money = {
  amount: bigint;
  currency: Currency;
};

export function sameCurrency(a: Money, b: Money): boolean {
  return a.currency === b.currency;
}

export function addMoney(a: Money, b: Money): Money {
  if (!sameCurrency(a, b)) {
    throw new DomainError(
      "CURRENCY_MISMATCH",
      `cannot add ${a.currency} and ${b.currency}`,
    );
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function negateMoney(m: Money): Money {
  return { amount: -m.amount, currency: m.currency };
}

export function zeroMoney(currency: Currency): Money {
  return { amount: 0n, currency };
}
