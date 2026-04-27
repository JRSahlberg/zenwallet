import { useMemo, useState } from "react";
import type { AccountId, Transaction, Wallet } from "../../domain";
import { formatMoney } from "./formatMoney";
import { useWalletStore } from "./store";
import "./TransactionsView.css";

type FilterState = {
  accountId: "all" | AccountId;
  category: "all" | string;
  search: string;
};

function filterTransactions(
  wallet: Wallet,
  filters: FilterState,
): Transaction[] {
  const needle = filters.search.trim().toLowerCase();
  const base = [...wallet.transactions]
    .filter((t) => !t.voided)
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));

  return base.filter((tx) => {
    if (filters.accountId !== "all" && tx.accountId !== filters.accountId) {
      return false;
    }
    if (filters.category !== "all" && tx.category !== filters.category) {
      return false;
    }
    if (needle !== "") {
      const payee = tx.payee.toLowerCase();
      const memo = (tx.memo ?? "").toLowerCase();
      if (!payee.includes(needle) && !memo.includes(needle)) {
        return false;
      }
    }
    return true;
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export function TransactionsView() {
  const { state } = useWalletStore();
  const [filters, setFilters] = useState<FilterState>({
    accountId: "all",
    category: "all",
    search: "",
  });

  const categories = useMemo(() => {
    if (state === null) return [];
    const set = new Set<string>();
    for (const tx of state.transactions) {
      if (!tx.voided) set.add(tx.category);
    }
    return [...set].sort();
  }, [state]);

  if (state === null || state.transactions.every((t) => t.voided)) {
    return (
      <section className="transactions-view">
        <h1>Transactions</h1>
        <p className="transactions-view__empty">
          No transactions yet. Create a wallet on the Wallet tab, then add
          transactions from the Add tab.
        </p>
      </section>
    );
  }

  const accountNames = new Map(state.accounts.map((a) => [a.id, a.name]));
  const rows = filterTransactions(state, filters);

  return (
    <section className="transactions-view">
      <h1>Transactions</h1>
      <div className="transactions-view__filters">
        <label>
          Account
          <select
            value={filters.accountId}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                accountId: e.target.value === "all"
                  ? "all"
                  : (e.target.value as AccountId),
              }))
            }
          >
            <option value="all">All accounts</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search
          <input
            type="search"
            value={filters.search}
            placeholder="Payee or memo"
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
          />
        </label>
      </div>
      {rows.length === 0 ? (
        <p className="transactions-view__empty">
          No transactions match the current filters.
        </p>
      ) : (
        <ul className="transactions-view__list">
          {rows.map((tx) => (
            <li key={tx.id} className="transactions-view__row">
              <span className="transactions-view__payee">{tx.payee}</span>
              <span className="transactions-view__category">{tx.category}</span>
              <span className="transactions-view__account">
                {accountNames.get(tx.accountId) ?? tx.accountId}
              </span>
              <span className="transactions-view__date">
                {formatDate(tx.occurredAt)}
              </span>
              <span className="transactions-view__amount">
                {formatMoney(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
