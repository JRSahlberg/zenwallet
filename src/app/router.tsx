import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'
import { WalletView } from '../features/wallet/WalletView'

export const navDestinations: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/wallet', label: 'Wallet' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'wallet', element: <WalletView /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
