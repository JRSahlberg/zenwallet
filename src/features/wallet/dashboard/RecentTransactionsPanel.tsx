import { Link } from "react-router-dom";
import type { Wallet } from "../../../domain";
import { amountSignClass } from "../amountSign";
import { formatMoney } from "../formatMoney";

const MAX_ROWS = 5;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export function RecentTransactionsPanel({ wallet }: { wallet: Wallet }) {
  const accountNames = new Map(
    wallet.accounts.map((a) => [a.id, a.name]),
  );
  const rows = [...wallet.transactions]
    .filter((t) => !t.voided)
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, MAX_ROWS);

  return (
    <section className="dashboard-card dashboard-card--wide">
      <header className="dashboard-card__header">
        <h2>Recent transactions</h2>
        <Link to="/transactions">See all</Link>
      </header>
      {rows.length === 0 ? (
        <p className="dashboard-card__empty">No transactions yet.</p>
      ) : (
        <ul className="dashboard-card__recent">
          {rows.map((tx) => {
            const accountName = accountNames.get(tx.accountId) ?? tx.accountId;
            const date = formatDate(tx.occurredAt);
            const signClass = amountSignClass(tx.amount.amount);
            const amountClass = signClass
              ? `dashboard-card__recent-amount ${signClass}`
              : "dashboard-card__recent-amount";
            return (
              <li key={tx.id} className="dashboard-card__recent-row">
                <span className="dashboard-card__recent-payee">{tx.payee}</span>
                <span className="dashboard-card__recent-category">
                  {tx.category}
                </span>
                <span className="dashboard-card__recent-account">
                  {accountName}
                </span>
                <span className="dashboard-card__recent-date">{date}</span>
                <span className={amountClass}>{formatMoney(tx.amount)}</span>
                <span className="dashboard-card__recent-meta">
                  {tx.category} · {accountName} · {date}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
