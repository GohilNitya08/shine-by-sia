import { Link } from 'react-router-dom'
import { fmtPrice } from '../config/site'
import Media from './Media'

export default function ProductCard({ p }) {
  return (
    <Link to={`/shop/${p.slug}`} className="product-card">
      <div className="media">
        <Media src={p.images?.[0]} seed={p.slug} alt={p.name} />
        {!p.is_available && <span className="badge mute sold">Sold out</span>}
      </div>
      <div className="body">
        <h3 className="name">{p.name}</h3>
        <span className="price">{p.price != null ? fmtPrice(p.price) : 'Price on request'}</span>
        {p.price != null && p.compare_at_price > p.price && (
          <s className="muted" style={{ marginLeft: 8, fontSize: '.9rem' }}>{fmtPrice(p.compare_at_price)}</s>
        )}
      </div>
    </Link>
  )
}
