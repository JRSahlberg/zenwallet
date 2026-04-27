export type WalletId = string & { readonly __brand: "WalletId" };
export type AccountId = string & { readonly __brand: "AccountId" };
export type TransactionId = string & { readonly __brand: "TransactionId" };

export function newId<T extends string>(): T {
  return crypto.randomUUID() as unknown as T;
}
