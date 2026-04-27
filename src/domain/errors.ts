export type DomainErrorCode =
  | "NO_WALLET"
  | "WALLET_ALREADY_EXISTS"
  | "UNKNOWN_ACCOUNT"
  | "DUPLICATE_ID"
  | "CURRENCY_MISMATCH"
  | "ACCOUNT_ARCHIVED"
  | "UNKNOWN_TRANSACTION"
  | "ALREADY_VOIDED";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "DomainError";
  }
}
