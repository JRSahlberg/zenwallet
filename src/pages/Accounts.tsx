import { Outlet } from "react-router-dom";
import { AccountsHeader } from "../features/wallet/AccountsHeader";

export default function Accounts() {
  return (
    <section>
      <AccountsHeader />
      <Outlet />
    </section>
  );
}
