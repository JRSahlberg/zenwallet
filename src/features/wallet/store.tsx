import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { walletReducer } from "../../domain";
import type { Action, DomainState } from "../../domain";

type WalletStore = {
  state: DomainState;
  dispatch: Dispatch<Action>;
};

const SENTINEL: unique symbol = Symbol("WalletStoreSentinel");

const WalletStoreContext = createContext<WalletStore | typeof SENTINEL>(
  SENTINEL,
);

export function WalletStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, null);
  return (
    <WalletStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </WalletStoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWalletStore(): WalletStore {
  const value = useContext(WalletStoreContext);
  if (value === SENTINEL) {
    throw new Error(
      "useWalletStore must be called inside WalletStoreProvider",
    );
  }
  return value;
}
