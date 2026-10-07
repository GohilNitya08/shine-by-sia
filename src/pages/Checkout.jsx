import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { site, fmtPrice } from '../config/site'
import { useCart } from '../lib/cart'
import { placeOrder } from '../lib/api'
import { isEmail, isPhone } from '../lib/utils'
import Seo from '../components/Seo'
import Field from '../components/Field'

const empty = { name: '', phone: '', email: '', address_line: '', city: '', state: '', pincode: '', notes: '', website: '' }

export function validateCheckout(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!isPhone(f.phone)) e.phone = 'Enter a valid phone number.'
  if (f.email.trim() && !isEmail(f.email)) e.email = 'Enter a valid email or leave it blank.'
  if (f.address_line.trim().length < 5) e.address_line = 'Please enter your address.'
  if (f.city.trim().length < 2) e.city = 'Please enter your city.'
  if (!/^[0-9A-Za-z -]{4,10}$/.test(f.pincode.trim())) e.pincode = 'Enter a valid pincode.'
  return e
}

export default function Checkout() {
  const cart = useCart()
  const nav = useNavigate()
  const [f, setF] = useState(empty)
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')
  const placed = useRef(false) // stops the empty-cart redirect firing after a successful order

  if (cart.lines.length === 0 && !placed.current) return <Navigate to="/cart" replace />
  const set = (k) => (e) => {
    const v = e.target.value // read now, not inside the updater
    setF((s) => ({ ...s, [k]: v }))
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (f.website) return // honeypot: bots fill hidden fields
    const e = validateCheckout(f)
    setErrs(e)
    if (Object.keys(e).length) return
    setBusy(true); setFail('')
    try {
      const { website, ...customer } = f
      const res = await placeOrder(customer, cart.lines)
      const summary = cart.lines.map((l) => ({ name: l.name, size: l.size, qty: l.qty, line: l.price * l.qty }))
      placed.current = true
      cart.clear()
      nav('/order-placed', { replace: true, state: { order: res, summary, name: f.name } })
    } catch (err) {
      setFail(err.message)
    } finally { setBusy(false) }
  }


  return (
    <div className="container page-pad">
      <Seo title="Checkout" />
      <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)' }}>Guest <span className="italic">checkout</span></h1>
      <form className="split" onSubmit={submit} noValidate>
        <div className="card">
          {fail && <div className="alert err" role="alert">{fail}</div>}
          <div className="field-row">
            <Field id="name" value={f.name} onChange={set('name')} error={errs.name} label="Full name" req autoComplete="name" />
            <Field id="phone" value={f.phone} onChange={set('phone')} error={errs.phone} label="Phone / WhatsApp" req type="tel" autoComplete="tel" inputMode="tel" />
          </div>
          <Field id="email" value={f.email} onChange={set('email')} error={errs.email} label="Email (optional)" type="email" autoComplete="email" />
          <Field id="address_line" value={f.address_line} onChange={set('address_line')} error={errs.address_line} label="Address" req autoComplete="street-address" />
          <div className="field-row">
            <Field id="city" value={f.city} onChange={set('city')} error={errs.city} label="City" req autoComplete="address-level2" />
            <Field id="state" value={f.state} onChange={set('state')} error={errs.state} label="State" autoComplete="address-level1" />
            <Field id="pincode" value={f.pincode} onChange={set('pincode')} error={errs.pincode} label="Pincode" req autoComplete="postal-code" inputMode="numeric" />
          </div>
          <div className="field">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" value={f.notes} onChange={set('notes')} maxLength={1000} placeholder="Anything Sia should know about nail size, delivery, etc." />
          </div>
          <div className="hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
          <div className="alert info">{site.checkoutNote}</div>
        </div>
        <aside className="card summary">
          <h3>Your order</h3>
          {cart.lines.map((l) => (
            <div className="sum-row" key={cart.keyOf(l)}><span>{l.name}{l.size && ` (${l.size})`} × {l.qty}</span><span>{fmtPrice(l.price * l.qty)}</span></div>
          ))}
          <div className="sum-row muted"><span>Shipping</span><span>Confirmed after ordering</span></div>
          <div className="sum-row total"><span>Total</span><span>{fmtPrice(cart.subtotal)}</span></div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
          <p className="muted center" style={{ fontSize: '.8rem', marginTop: 10 }}>{site.shippingNote} <Link to="/cart">Edit bag</Link></p>
        </aside>
      </form>
    </div>
  )
}
