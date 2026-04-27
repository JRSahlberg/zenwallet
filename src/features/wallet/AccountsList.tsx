import { Link } from "react-router-dom";
import { balanceOfAccount } from "../../domain";
import { formatMoney } from "./formatMoney";
import { useWalletStore } from "./store";
import "./AccountsView.css";

export function AccountsList() {
  const { state } = useWalletStore();
  if (state === null || state.accounts.length === 0) {
    return (
      <p className="accounts-view__empty">
        No accounts yet. Create a wallet on the Wallet tab to seed demo
        accounts.
      </p>
    );
  }

  return (
    <ul className="accounts-view__list">
      {state.accounts.map((account) => (
        <li key={account.id} className="accounts-view__card">
          <Link to={`/accounts/${account.id}`} className="accounts-view__link">
            <span className="accounts-view__name">{account.name}</span>
            <span className="accounts-view__currency">{account.currency}</span>
            <span className="accounts-view__balance">
              {formatMoney(balanceOfAccount(state, account.id))}
            </span>
            {account.archived && (
              <span className="archived-badge">Archived</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
