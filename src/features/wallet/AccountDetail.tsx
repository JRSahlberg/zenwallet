import { Link, useParams } from "react-router-dom";
import type { AccountId } from "../../domain";
import { balanceOfAccount } from "../../domain";
import { amountSignClass } from "./amountSign";
import { formatMoney } from "./formatMoney";
import { useWalletStore } from "./store";
import "./AccountsView.css";

const MAX_ROWS = 10;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export function AccountDetail() {
  const { state } = useWalletStore();
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId as AccountId | undefined;

  const account =
    state !== null && accountId !== undefined
      ? state.accounts.find((a) => a.id === accountId)
      : undefined;

  if (!account || state === null) {
    return (
      <section className="account-detail">
        <h2>Account not found</h2>
        <p>We couldn't find that account.</p>
        <Link to="/accounts">Back to accounts</Link>
      </section>
    );
  }

  const balance = balanceOfAccount(state, account.id);
  const rows = [...state.transactions]
    .filter((t) => t.accountId === account.id && !t.voided)
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, MAX_ROWS);

  return (
    <section className="account-detail">
      <header className="account-detail__header">
        <h2>{account.name}</h2>
        <span className="account-detail__balance">{formatMoney(balance)}</span>
        {account.archived && <span className="archived-badge">Archived</span>}
      </header>
      {rows.length === 0 ? (
        <p className="accounts-view__empty">
          No transactions on this account yet.
        </p>
      ) : (
        <ul className="account-detail__list">
          {rows.map((tx) => {
            const date = formatDate(tx.occurredAt);
            const signClass = amountSignClass(tx.amount.amount);
            const amountClass = signClass
              ? `account-detail__amount ${signClass}`
              : "account-detail__amount";
            return (
              <li key={tx.id} className="account-detail__row">
                <span className="account-detail__payee">{tx.payee}</span>
                <span className="account-detail__category">{tx.category}</span>
                <span className="account-detail__date">{date}</span>
                <span className={amountClass}>{formatMoney(tx.amount)}</span>
                <span className="account-detail__meta">
                  {tx.category} · {date}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Link to="/accounts" className="account-detail__back">
        ← Back to accounts
      </Link>
    </section>
  );
}
