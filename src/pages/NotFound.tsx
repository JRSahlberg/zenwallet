import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section>
      <h1>Not found</h1>
      <p>We couldn't find that page.</p>
      <Link to="/">Back to home</Link>
    </section>
  )
}
