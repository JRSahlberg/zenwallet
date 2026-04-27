import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { AccountId, TransactionId } from "../../domain";
import { newId } from "../../domain";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";
import { parseMoneyInput } from "./parseMoneyInput";
import { useWalletStore } from "./store";
import "./AddTransactionForm.css";

type TxType = "income" | "expense";

type Errors = Partial<{
  payee: string;
  amount: string;
  accountId: string;
  category: string;
}>;

const CURRENCY_EXPONENT: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  SEK: 2,
};

const DEFAULT_EXPONENT = 2;

const SUCCESS_CLEAR_MS = 3000;

export function AddTransactionForm() {
  const { state, dispatch } = useWalletStore();

  const [type, setType] = useState<TxType>("expense");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<AccountId | "">("");
  const [category, setCategory] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current !== null) {
        window.clearTimeout(successTimer.current);
      }
    };
  }, []);

  if (state === null) {
    return (
      <section className="add-transaction">
        <h1>Add transaction</h1>
        <p className="add-transaction__guidance">
          Create a wallet on the <Link to="/wallet">Wallet</Link> tab before
          adding transactions.
        </p>
        <button type="button" disabled className="add-transaction__submit">
          Add transaction
        </button>
      </section>
    );
  }

  const openAccounts = state.accounts.filter((a) => !a.archived);
  const selectedAccount =
    accountId === ""
      ? null
      : state.accounts.find((a) => a.id === accountId) ?? null;
  const exponent =
    selectedAccount === null
      ? DEFAULT_EXPONENT
      : CURRENCY_EXPONENT[selectedAccount.currency] ?? DEFAULT_EXPONENT;
  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function clearSuccess() {
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
      successTimer.current = null;
    }
    setSuccess(null);
  }

  function validateField<K extends keyof Errors>(key: K, value: string) {
    setErrors((prev) => {
      const next = { ...prev };
      if (key === "payee" && value.trim() !== "") delete next.payee;
      if (key === "accountId" && value !== "") delete next.accountId;
      if (key === "category" && value !== "") delete next.category;
      if (key === "amount") {
        if (selectedAccount !== null) {
          const parsed = parseMoneyInput(value, exponent);
          if (parsed.ok) delete next.amount;
        }
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors: Errors = {};
    if (payee.trim() === "") nextErrors.payee = "Payee is required";
    if (accountId === "") nextErrors.accountId = "Pick an account";
    if (category === "") nextErrors.category = "Pick a category";

    if (accountId === "") {
      if (amount.trim() === "") nextErrors.amount = "Amount is required";
    } else {
      const parsed = parseMoneyInput(amount, exponent);
      if (!parsed.ok) {
        nextErrors.amount = parsed.reason;
      } else if (parsed.amount === 0n) {
        nextErrors.amount = "Amount must be non-zero";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (selectedAccount === null) return;
    const parsed = parseMoneyInput(amount, exponent);
    if (!parsed.ok) return;
    const sign = type === "income" ? 1n : -1n;
    const signedAmount = sign * (parsed.amount < 0n ? -parsed.amount : parsed.amount);

    dispatch({
      type: "transaction/post",
      accountId: selectedAccount.id,
      transactionId: newId<TransactionId>(),
      amount: { amount: signedAmount, currency: selectedAccount.currency },
      occurredAt: new Date().toISOString(),
      payee: payee.trim(),
      category,
      memo: memo.trim() === "" ? undefined : memo.trim(),
    });

    setType("expense");
    setPayee("");
    setAmount("");
    setAccountId("");
    setCategory("");
    setMemo("");
    setErrors({});
    clearSuccess();
    setSuccess("Transaction added");
    successTimer.current = window.setTimeout(() => {
      setSuccess(null);
      successTimer.current = null;
    }, SUCCESS_CLEAR_MS);
  }

  return (
    <section className="add-transaction">
      <h1>Add transaction</h1>
      <form className="add-transaction__form" onSubmit={handleSubmit}>
        <fieldset className="add-transaction__type">
          <legend>Type</legend>
          <label>
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === "expense"}
              onChange={() => {
                setType("expense");
                setCategory("");
                clearSuccess();
              }}
            />
            Expense
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === "income"}
              onChange={() => {
                setType("income");
                setCategory("");
                clearSuccess();
              }}
            />
            Income
          </label>
        </fieldset>

        <label className="add-transaction__field">
          Payee
          <input
            type="text"
            value={payee}
            onChange={(e) => {
              setPayee(e.target.value);
              validateField("payee", e.target.value);
              clearSuccess();
            }}
            aria-invalid={errors.payee !== undefined}
          />
          {errors.payee && (
            <span className="add-transaction__error">{errors.payee}</span>
          )}
        </label>

        <label className="add-transaction__field">
          Amount
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              validateField("amount", e.target.value);
              clearSuccess();
            }}
            aria-invalid={errors.amount !== undefined}
          />
          {errors.amount && (
            <span className="add-transaction__error">{errors.amount}</span>
          )}
        </label>

        <label className="add-transaction__field">
          Account
          <select
            value={accountId}
            onChange={(e) => {
              const next = e.target.value as AccountId | "";
              setAccountId(next);
              validateField("accountId", next);
              clearSuccess();
            }}
            aria-invalid={errors.accountId !== undefined}
          >
            <option value="">Select an account…</option>
            {openAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </select>
          {errors.accountId && (
            <span className="add-transaction__error">{errors.accountId}</span>
          )}
        </label>

        <label className="add-transaction__field">
          Category
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              validateField("category", e.target.value);
              clearSuccess();
            }}
            aria-invalid={errors.category !== undefined}
          >
            <option value="">Select a category…</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="add-transaction__error">{errors.category}</span>
          )}
        </label>

        <label className="add-transaction__field">
          Memo (optional)
          <input
            type="text"
            value={memo}
            onChange={(e) => {
              setMemo(e.target.value);
              clearSuccess();
            }}
          />
        </label>

        <button type="submit" className="add-transaction__submit">
          Add transaction
        </button>

        {success !== null && (
          <p role="status" className="add-transaction__success">
            {success}
          </p>
        )}
      </form>
    </section>
  );
}
