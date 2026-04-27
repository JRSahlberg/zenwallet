import type { Wallet } from "../../../domain";
import { monthlyTotals } from "../../../domain";
import { formatMoney } from "../formatMoney";

export function MonthTotalsCard({
  wallet,
  start,
  endExclusive,
}: {
  wallet: Wallet;
  start: string;
  endExclusive: string;
}) {
  const entries = monthlyTotals(wallet, start, endExclusive);
  return (
    <section className="dashboard-card">
      <h2>This month</h2>
      {entries.length === 0 ? (
        <p className="dashboard-card__empty">No activity yet this month.</p>
      ) : (
        <ul className="dashboard-card__list">
          {entries.map((entry) => (
            <li key={entry.currency} className="dashboard-card__month-row">
              <span className="dashboard-card__label">{entry.currency}</span>
              <span className="dashboard-card__month-income">
                +{formatMoney({ amount: entry.income, currency: entry.currency })}
              </span>
              <span className="dashboard-card__month-expense">
                −{formatMoney({ amount: entry.expense, currency: entry.currency })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
