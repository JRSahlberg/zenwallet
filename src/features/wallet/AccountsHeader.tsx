import { walletTotals } from "../../domain";
import { formatMoney } from "./formatMoney";
import { useWalletStore } from "./store";
import "./AccountsView.css";

export function AccountsHeader() {
  const { state } = useWalletStore();
  if (state === null) {
    return (
      <header className="accounts-header">
        <h1>Accounts</h1>
      </header>
    );
  }
  const totals = Object.entries(walletTotals(state));
  return (
    <header className="accounts-header">
      <h1>Accounts</h1>
      <div className="accounts-header__networth">
        <span className="accounts-header__label">Net worth</span>
        {totals.length === 0 ? (
          <span className="accounts-header__empty">No accounts yet.</span>
        ) : (
          <ul className="accounts-header__list">
            {totals.map(([currency, amount]) => (
              <li key={currency}>
                <span className="accounts-header__currency">{currency}</span>
                <span className="accounts-header__amount">
                  {formatMoney({ amount, currency })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
