import { useState } from 'react'
import { fmtPrice, waLink } from '../config/site'
import { fmtDate } from '../lib/utils'
import { adminPatch } from '../lib/api'
import { useAdminList, Modal, Pill } from './ui'
import Toast from '../components/Toast'

export const ORDER_STATUSES = ['new', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled']
const waDigits = (p) => String(p).replace(/[^0-9]/g, '')

export default function OrdersAdmin() {
  const { rows, loading, error, reload } = useAdminList('orders')
  const [view, setView] = useState(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')
  const shown = rows.filter((o) => filter === 'all' || o.status === filter)

  const update = async (o, patch) => {
    try { const n = await adminPatch('orders', o.id, patch); setView((v) => (v && v.id === o.id ? n : v)); setToast('Saved'); reload() }
    catch (ex) { setToast(ex.message) }
  }

  return (
    <>
      <div className="row"><h1>Orders</h1><span className="spacer" />
        <select aria-label="Filter by status" className="field" style={{ padding: '.6rem 1rem', borderRadius: 12, border: '1px solid var(--line)' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {error && <div className="alert err">{error}</div>}
      <div className="table-wrap"><table className="t">
        <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {shown.map((o) => (
            <tr key={o.id}>
              <td>#{o.order_no}</td><td>{fmtDate(o.created_at)}</td>
              <td><strong>{o.customer_name}</strong><div className="muted" style={{ fontSize: '.82rem' }}>{o.phone}</div></td>
              <td>{fmtPrice(o.subtotal)}</td>
              <td><select aria-label={`Status of order ${o.order_no}`} value={o.status} onChange={(e) => update(o, { status: e.target.value })} style={{ padding: '.4rem .7rem', borderRadius: 10, border: '1px solid var(--line)' }}>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => setView(o)}>Details</button></td>
            </tr>
          ))}
          {!shown.length && !loading && <tr><td colSpan="6" className="muted">No orders to show.</td></tr>}
        </tbody>
      </table></div>

      {view && (
        <Modal title={`Order #${view.order_no}`} onClose={() => setView(null)}>
          <p><Pill value={view.status} /> <span className="muted">{fmtDate(view.created_at)}</span></p>
          <h3>Items</h3>
          {view.items.map((i, k) => <div className="sum-row" key={k}><span>{i.name}{i.size ? ` (${i.size})` : ''} × {i.qty}</span><span>{fmtPrice(i.line_total)}</span></div>)}
          <div className="sum-row total"><span>Total</span><span>{fmtPrice(view.subtotal)}</span></div>
          <h3 style={{ marginTop: 16 }}>Customer</h3>
          <p style={{ margin: 0 }}><strong>{view.customer_name}</strong><br />{view.phone}{view.email && <><br />{view.email}</>}<br />{view.address_line}, {view.city}{view.state && `, ${view.state}`} {view.pincode}</p>
          {view.notes && <p><em>Customer note:</em> {view.notes}</p>}
          <div className="row" style={{ margin: '14px 0' }}>
            <a className="btn btn-wa btn-sm" href={`https://wa.me/${waDigits(view.phone)}?text=${encodeURIComponent(`Hi ${view.customer_name.split(' ')[0]}! This is about your order #${view.order_no}.`)}`} target="_blank" rel="noopener noreferrer">WhatsApp customer</a>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); update(view, { admin_notes: e.target.elements.notes.value }) }}>
            <div className="field"><label htmlFor="an">Private notes</label><textarea id="an" name="notes" defaultValue={view.admin_notes || ''} maxLength={1000} /></div>
            <button className="btn btn-primary btn-sm">Save notes</button>
          </form>
        </Modal>
      )}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  )
}
