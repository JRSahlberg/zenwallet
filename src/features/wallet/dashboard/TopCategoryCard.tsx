import type { Currency, Wallet } from "../../../domain";
import { topSpendingCategory } from "../../../domain";
import { formatMoney } from "../formatMoney";

export function TopCategoryCard({
  wallet,
  start,
  endExclusive,
  currency,
}: {
  wallet: Wallet;
  start: string;
  endExclusive: string;
  currency: Currency | null;
}) {
  const top =
    currency === null
      ? null
      : topSpendingCategory(wallet, start, endExclusive, currency);

  return (
    <section className="dashboard-card">
      <h2>Top spending</h2>
      {top === null || currency === null ? (
        <p className="dashboard-card__empty">No expenses this month.</p>
      ) : (
        <div className="dashboard-card__row">
          <span className="dashboard-card__label">{top.category}</span>
          <span className="dashboard-card__value">
            {formatMoney({ amount: top.total, currency })}
          </span>
        </div>
      )}
    </section>
  );
}
