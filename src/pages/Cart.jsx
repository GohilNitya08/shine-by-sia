import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fmtPrice } from '../config/site'
import { useCart } from '../lib/cart'
import { listProducts } from '../lib/api'
import Media from '../components/Media'
import Seo from '../components/Seo'

export default function Cart() {
  const cart = useCart()
  // Refresh prices/availability so the bag never shows stale data.
  useEffect(() => { listProducts().then(cart.sync).catch(() => {}) }, []) // eslint-disable-line
  const blocked = cart.lines.some((l) => l.available === false)

  if (cart.lines.length === 0) return (
    <div className="container page-pad center">
      <Seo title="Your bag" />
      <h1 style={{ fontSize: '2.6rem' }}>Your bag is empty</h1>
      <p className="muted">Find a set you love in the shop.</p>
      <Link to="/shop" className="btn btn-primary">Browse press-ons</Link>
    </div>
  )

  return (
    <div className="container page-pad">
      <Seo title="Your bag" />
      <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)' }}>Your <span className="italic">bag</span></h1>
      <div className="split">
        <div>
          {cart.lines.map((l) => {
            const k = cart.keyOf(l)
            return (
              <div className="cart-line" key={k}>
                <div className="thumb"><Media src={l.image} seed={l.slug} alt={l.name} tag={false} /></div>
                <div>
                  <Link to={`/shop/${l.slug}`}><strong>{l.name}</strong></Link>
                  {l.size && <div className="muted" style={{ fontSize: '.9rem' }}>Size {l.size}</div>}
                  <div className="muted">{fmtPrice(l.price)}</div>
                  {l.available === false && <span className="badge bad">Sold out: remove to continue</span>}
                </div>
                <div className="end row">
                  <div className="qty">
                    <button aria-label="Decrease" onClick={() => cart.setQty(k, l.qty - 1)}>−</button>
                    <span>{l.qty}</span>
                    <button aria-label="Increase" onClick={() => cart.setQty(k, l.qty + 1)}>+</button>
                  </div>
                  <strong>{fmtPrice(l.price * l.qty)}</strong>
                  <button className="btn btn-sm btn-danger" onClick={() => cart.remove(k)} aria-label={`Remove ${l.name}`}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
        <aside className="card summary">
          <h3>Summary</h3>
          <div className="sum-row"><span>Subtotal</span><span>{fmtPrice(cart.subtotal)}</span></div>
          <div className="sum-row muted"><span>Shipping</span><span>Confirmed after ordering</span></div>
          <div className="sum-row total"><span>Total</span><span>{fmtPrice(cart.subtotal)}</span></div>
          <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} aria-disabled={blocked} onClick={(e) => blocked && e.preventDefault()}>Checkout as guest</Link>
          <Link to="/shop" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }}>Keep shopping</Link>
        </aside>
      </div>
    </div>
  )
}
