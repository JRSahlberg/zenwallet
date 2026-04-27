import type { Wallet } from "../../../domain";
import { balanceOfAccount } from "../../../domain";
import { formatMoney } from "../formatMoney";

export function AccountSummaryList({ wallet }: { wallet: Wallet }) {
  return (
    <section className="dashboard-card">
      <h2>Accounts</h2>
      {wallet.accounts.length === 0 ? (
        <p className="dashboard-card__empty">No accounts yet.</p>
      ) : (
        <ul className="dashboard-card__accounts">
          {wallet.accounts.map((account) => (
            <li key={account.id} className="dashboard-card__account">
              <span className="dashboard-card__account-name">
                {account.name}
              </span>
              <span className="dashboard-card__account-currency">
                {account.currency}
              </span>
              <span className="dashboard-card__account-balance">
                {formatMoney(balanceOfAccount(wallet, account.id))}
              </span>
              {account.archived && (
                <span className="archived-badge">Archived</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
