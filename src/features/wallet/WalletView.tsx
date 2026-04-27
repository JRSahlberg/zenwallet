import "./WalletView.css";
import { AccountSummaryList } from "./dashboard/AccountSummaryList";
import { MonthTotalsCard } from "./dashboard/MonthTotalsCard";
import { NetWorthCard } from "./dashboard/NetWorthCard";
import { RecentTransactionsPanel } from "./dashboard/RecentTransactionsPanel";
import { TopCategoryCard } from "./dashboard/TopCategoryCard";
import { currentMonthWindow } from "./monthWindow";
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

  const { start, endExclusive } = currentMonthWindow();
  const primaryCurrency = state.accounts[0]?.currency ?? null;

  return (
    <section className="wallet-view">
      <h1>{state.name}</h1>
      <div className="wallet-view__grid">
        <NetWorthCard wallet={state} />
        <MonthTotalsCard
          wallet={state}
          start={start}
          endExclusive={endExclusive}
        />
        <TopCategoryCard
          wallet={state}
          start={start}
          endExclusive={endExclusive}
          currency={primaryCurrency}
        />
        <AccountSummaryList wallet={state} />
        <RecentTransactionsPanel wallet={state} />
      </div>
    </section>
  );
}
