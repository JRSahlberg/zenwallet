import type { Wallet } from "../../../domain";
import { walletTotals } from "../../../domain";
import { formatMoney } from "../formatMoney";

export function NetWorthCard({ wallet }: { wallet: Wallet }) {
  const totals = walletTotals(wallet);
  const entries = Object.entries(totals);
  return (
    <section className="dashboard-card">
      <h2>Net worth</h2>
      {entries.length === 0 ? (
        <p className="dashboard-card__empty">No accounts yet.</p>
      ) : (
        <ul className="dashboard-card__list">
          {entries.map(([currency, amount]) => (
            <li key={currency} className="dashboard-card__row">
              <span className="dashboard-card__label">{currency}</span>
              <span className="dashboard-card__value">
                {formatMoney({ amount, currency })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
