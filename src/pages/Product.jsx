import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { site, fmtPrice, waLink } from '../config/site'
import { useAsync } from '../lib/useAsync'
import { getProduct } from '../lib/api'
import { useCart } from '../lib/cart'
import Media from '../components/Media'
import Seo from '../components/Seo'
import Toast from '../components/Toast'
import { Loading } from '../components/State'

export default function Product() {
  const { slug } = useParams()
  const { data: p, loading } = useAsync(() => getProduct(slug), [slug])
  const cart = useCart()
  const [img, setImg] = useState(0)
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')

  if (loading) return <div className="container page-pad"><Loading rows={2} /></div>
  if (!p) return (
    <div className="container page-pad center">
      <h2>We couldn’t find that product</h2>
      <Link className="btn btn-primary" to="/shop">Back to the shop</Link>
    </div>
  )
  const imgs = p.images?.length ? p.images : [null]
  const needsSize = p.size_options?.length > 0

  const add = () => {
    if (needsSize && !size) { setErr('Please choose a size.'); return }
    setErr('')
    cart.add({ productId: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: p.images?.[0] || null, size: needsSize ? size : '', qty, available: true })
    setToast('Added to your bag')
  }

  return (
    <div className="container page-pad">
      <Seo title={p.name} description={p.description?.slice(0, 150)} />
      <p className="muted" style={{ fontSize: '.9rem' }}><Link to="/shop">Shop</Link> / {p.name}</p>
      <div className="pd">
        <div>
          <div className="main-img"><Media src={imgs[img]} seed={p.slug} alt={p.name} eager /></div>
          {imgs.length > 1 && (
            <div className="thumbs">
              {imgs.map((u, i) => (
                <button key={i} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}><Media src={u} seed={p.slug + i} alt="" tag={false} /></button>
              ))}
            </div>
          )}
        </div>
        <div>
          <span className="eyebrow">{p.category}</span>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>{p.name}</h1>
          <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--rose-deep)' }}>
            {p.price != null ? fmtPrice(p.price) : 'Price on request'}
            {p.price != null && p.compare_at_price > p.price && <s className="muted" style={{ marginLeft: 10, fontSize: '1.05rem' }}>{fmtPrice(p.compare_at_price)}</s>}
          </p>
          <p className="muted" style={{ whiteSpace: 'pre-line' }}>{p.description}</p>

          {p.price == null ? (
            <div className="alert info">This set is price on request. Message Sia on WhatsApp for the price and to order. Available in Vadodara only.</div>
          ) : p.is_available ? (
            <>
              {needsSize && (
                <>
                  <div className="field" style={{ marginBottom: 8 }}><label id="sizes">Size</label></div>
                  <div className="chips" role="radiogroup" aria-labelledby="sizes">
                    {p.size_options.map((s) => (
                      <button key={s} role="radio" aria-checked={size === s} className={`chip ${size === s ? 'on' : ''}`} onClick={() => { setSize(s); setErr('') }}>{s}</button>
                    ))}
                  </div>
                </>
              )}
              {err && <div className="alert err" role="alert">{err}</div>}
              <div className="row" style={{ marginBottom: 16 }}>
                <div className="qty">
                  <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span aria-live="polite">{qty}</span>
                  <button aria-label="Increase" onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
                </div>
                <button className="btn btn-primary" onClick={add}>Add to bag</button>
              </div>
            </>
          ) : (
            <div className="alert info">This set is currently sold out. Message Sia to ask about a custom version.</div>
          )}
          <a className="btn btn-ghost btn-sm" href={waLink(`Hi! I have a question about "${p.name}" from ${site.name}.`)} target="_blank" rel="noopener noreferrer">Ask about this on WhatsApp</a>
        </div>
      </div>
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
