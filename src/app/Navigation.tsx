import { NavLink } from 'react-router-dom'
import { navDestinations } from './router'
import './Navigation.css'

export function Navigation() {
  return (
    <nav>
      <ul>
        {navDestinations.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
