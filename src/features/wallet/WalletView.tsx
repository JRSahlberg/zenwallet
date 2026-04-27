import "./WalletView.css";
import { balanceOfAccount, walletTotals } from "../../domain";
import { formatMoney } from "./formatMoney";
import { buildDemoActions } from "./seedDemoWallet";
import { useWalletStore } from "./store";

export function WalletView() {
  const { state, dispatch } = useWalletStore();

  if (state === null) {
    return (
      <section className="wallet-view wallet-view--empty">
        <h1>No wallet yet</h1>
        <p>
          Seed a demo wallet to preview accounts, per-account balances, and
          per-currency totals.
        </p>
        <button
          type="button"
          onClick={() => {
            for (const action of buildDemoActions()) {
              dispatch(action);
            }
          }}
        >
          Create demo wallet
        </button>
      </section>
    );
  }

  const totals = walletTotals(state);

  return (
    <section className="wallet-view">
      <h1>{state.name}</h1>
      <ul className="wallet-view__accounts">
        {state.accounts.map((account) => (
          <li key={account.id} className="wallet-view__account">
            <span className="wallet-view__account-name">{account.name}</span>
            <span className="wallet-view__account-currency">
              {account.currency}
            </span>
            <span className="wallet-view__account-balance">
              {formatMoney(balanceOfAccount(state, account.id))}
            </span>
            {account.archived && (
              <span className="archived-badge">Archived</span>
            )}
          </li>
        ))}
      </ul>
      <section className="wallet-view__totals">
        <h2>Totals</h2>
        <ul>
          {Object.entries(totals).map(([currency, amount]) => (
            <li key={currency}>
              <span>{currency}</span>
              <span>{formatMoney({ amount, currency })}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
