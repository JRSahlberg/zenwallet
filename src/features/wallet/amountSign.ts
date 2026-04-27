export function amountSignClass(amount: bigint): string | undefined {
  if (amount < 0n) return "amount--negative";
  if (amount > 0n) return "amount--positive";
  return undefined;
}
