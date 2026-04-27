import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'
import Transactions from '../pages/Transactions'
import Accounts from '../pages/Accounts'
import Add from '../pages/Add'
import { WalletView } from '../features/wallet/WalletView'
import { AccountsList } from '../features/wallet/AccountsList'
import { AccountDetail } from '../features/wallet/AccountDetail'

export const navDestinations: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/wallet', label: 'Wallet' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/add', label: 'Add' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'wallet', element: <WalletView /> },
      { path: 'transactions', element: <Transactions /> },
      {
        path: 'accounts',
        element: <Accounts />,
        children: [
          { index: true, element: <AccountsList /> },
          { path: ':accountId', element: <AccountDetail /> },
        ],
      },
      { path: 'add', element: <Add /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
