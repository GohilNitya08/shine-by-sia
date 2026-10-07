import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <div className="container page-pad center">
      <Seo title="Page not found" />
      <h1>Oops, <span className="italic">lost polish</span></h1>
      <p className="muted">That page doesn’t exist.</p>
      <Link className="btn btn-primary" to="/">Back home</Link>
    </div>
  )
}
