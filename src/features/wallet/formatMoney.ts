import type { Money } from "../../domain";

const CURRENCY_EXPONENT: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  SEK: 2,
};

const DEFAULT_EXPONENT = 2;
const warnedCurrencies = new Set<string>();

export function formatMoney(money: Money, locale?: string): string {
  const { amount, currency } = money;
  let exponent = CURRENCY_EXPONENT[currency];
  if (exponent === undefined) {
    if (!warnedCurrencies.has(currency)) {
      warnedCurrencies.add(currency);
      console.warn(
        `formatMoney: unknown currency "${currency}", defaulting to exponent ${DEFAULT_EXPONENT}`,
      );
    }
    exponent = DEFAULT_EXPONENT;
  }

  const negative = amount < 0n;
  const absAmount = negative ? -amount : amount;
  const divisor = 10n ** BigInt(exponent);
  const integerPart = absAmount / divisor;
  const fractionPart = absAmount % divisor;
  const fractionStr = fractionPart.toString().padStart(exponent, "0");

  const formatter = new Intl.NumberFormat(locale ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  });

  const parts = formatter.formatToParts(integerPart);
  const positive = parts
    .map((part) => (part.type === "fraction" ? fractionStr : part.value))
    .join("");

  if (!negative) {
    return positive;
  }
  const negParts = formatter.formatToParts(-1n);
  const minusSign = negParts.find((p) => p.type === "minusSign")?.value ?? "-";
  return `${minusSign}${positive}`;
}
