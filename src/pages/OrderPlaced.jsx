import { Link, Navigate, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { site, fmtPrice, waLink } from '../config/site'
import Seo from '../components/Seo'
import { SparkleIcon } from '../components/Icons'

export default function OrderPlaced() {
  const { state } = useLocation()
  if (!state?.order) return <Navigate to="/" replace />
  const { order, summary, name } = state
  const lines = summary.map((s) => `• ${s.name}${s.size ? ` (${s.size})` : ''} × ${s.qty}`).join('\n')
  const msg = `Hi! I just placed order #${order.order_no} on your website.\n${lines}\nTotal: ${fmtPrice(order.total)}\nName: ${name}`
  return (
    <div className="container page-pad center" style={{ maxWidth: 640 }}>
      <Seo title="Order placed" />
      <m.div initial={{ scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }} style={{ color: 'var(--gold)' }}>
        <SparkleIcon size={54} />
      </m.div>
      <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)' }}>Thank you, <span className="italic">{name.split(' ')[0]}</span></h1>
      {order.demo && <div className="alert info">Demo mode: Supabase is not connected, so this order was not saved.</div>}
      <p>Your order <strong>#{order.order_no}</strong> has been received. Total <strong>{fmtPrice(order.total)}</strong>.</p>
      <p className="muted">{site.checkoutNote}</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <a className="btn btn-wa" href={waLink(msg)} target="_blank" rel="noopener noreferrer">Send order on WhatsApp</a>
        <Link className="btn btn-ghost" to="/shop">Keep shopping</Link>
      </div>
    </div>
  )
}
