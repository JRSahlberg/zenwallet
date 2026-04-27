export type ParseMoneyResult =
  | { ok: true; amount: bigint }
  | { ok: false; reason: string };

export function parseMoneyInput(
  input: string,
  exponent: number,
): ParseMoneyResult {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: false, reason: "Amount is required" };
  }
  if (exponent < 0 || !Number.isInteger(exponent)) {
    return { ok: false, reason: "Invalid currency exponent" };
  }

  const pattern =
    exponent === 0
      ? /^(-)?(\d+)$/
      : new RegExp(`^(-)?(\\d+)(?:\\.(\\d{1,${exponent}}))?$`);
  const match = pattern.exec(trimmed);
  if (!match) {
    return {
      ok: false,
      reason:
        exponent === 0
          ? "Enter a whole number"
          : `Enter a decimal with at most ${exponent} fractional digits`,
    };
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = match[2];
  const fraction = (match[3] ?? "").padEnd(exponent, "0");
  const combined = `${whole}${fraction}`;
  const magnitude = BigInt(combined);
  return { ok: true, amount: sign * magnitude };
}
