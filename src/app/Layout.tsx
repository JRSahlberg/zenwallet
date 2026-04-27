import { Link, Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import './Layout.css'

export function Layout() {
  return (
    <>
      <header>
        <Link to="/" className="brand" aria-label="ZenWallet home">
          <span className="brand__wordmark">ZenWallet</span>
          <span className="brand__tagline">Mindful money</span>
        </Link>
        <Navigation />
      </header>
      <main>
        <Outlet />
      </main>
      <footer />
    </>
  )
}
