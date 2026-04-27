import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import './Layout.css'

export function Layout() {
  return (
    <>
      <header>
        <Navigation />
      </header>
      <main>
        <Outlet />
      </main>
      <footer />
    </>
  )
}
