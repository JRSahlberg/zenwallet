import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { WalletStoreProvider } from './features/wallet/store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletStoreProvider>
      <RouterProvider router={router} />
    </WalletStoreProvider>
  </StrictMode>,
)
