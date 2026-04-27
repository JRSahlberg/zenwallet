import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import Landing from '../pages/Landing'
import NotFound from '../pages/NotFound'

export const navDestinations: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/app', label: 'App' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'app', element: <p>Coming soon</p> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
