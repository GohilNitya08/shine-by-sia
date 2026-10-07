import { Link } from 'react-router-dom'
import { fmtPrice } from '../config/site'
import { fmtDate } from '../lib/utils'
import { useAdminList, Pill } from './ui'

export default function Dashboard() {
  const orders = useAdminList('orders')
  const appts = useAdminList('appointment_requests')
  const products = useAdminList('products', [['sort_order', true]])
  const newOrders = orders.rows.filter((o) => o.status === 'new')
  const newAppts = appts.rows.filter((a) => a.status === 'new')
  const stats = [
    ['New orders', newOrders.length, '/admin/orders'],
    ['New appointment requests', newAppts.length, '/admin/appointments'],
    ['Products', products.rows.length, '/admin/products'],
    ['Sold out', products.rows.filter((p) => !p.is_available).length, '/admin/products'],
  ]
  return (
    <>
      <h1>Dashboard</h1>
      <div className="grid cols-4" style={{ marginBottom: 28 }}>
        {stats.map(([l, n, to]) => <Link to={to} key={l} className="card stat"><b>{n}</b><span className="muted">{l}</span></Link>)}
      </div>
      <div className="grid cols-2">
        <div>
          <h3>Latest orders</h3>
          <div className="table-wrap"><table className="t"><tbody>
            {orders.rows.slice(0, 5).map((o) => <tr key={o.id}><td>#{o.order_no}</td><td>{o.customer_name}</td><td>{fmtPrice(o.subtotal)}</td><td><Pill value={o.status} /></td></tr>)}
            {!orders.rows.length && <tr><td className="muted">No orders yet.</td></tr>}
          </tbody></table></div>
        </div>
        <div>
          <h3>Latest requests</h3>
          <div className="table-wrap"><table className="t"><tbody>
            {appts.rows.slice(0, 5).map((a) => <tr key={a.id}><td>#{a.request_no}</td><td>{a.name}</td><td>{fmtDate(a.created_at)}</td><td><Pill value={a.status} /></td></tr>)}
            {!appts.rows.length && <tr><td className="muted">No requests yet.</td></tr>}
          </tbody></table></div>
        </div>
      </div>
    </>
  )
}
