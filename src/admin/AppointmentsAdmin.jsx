import { useState } from 'react'
import { fmtDate } from '../lib/utils'
import { adminPatch } from '../lib/api'
import { useAdminList, Modal, Pill } from './ui'
import Toast from '../components/Toast'

export const APPT_STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled']

export default function AppointmentsAdmin() {
  const { rows, loading, error, reload } = useAdminList('appointment_requests')
  const [view, setView] = useState(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')
  const shown = rows.filter((a) => filter === 'all' || a.status === filter)
  const update = async (a, patch) => {
    try { const n = await adminPatch('appointment_requests', a.id, patch); setView((v) => (v && v.id === a.id ? n : v)); setToast('Saved'); reload() }
    catch (ex) { setToast(ex.message) }
  }
  return (
    <>
      <div className="row"><h1>Appointment requests</h1><span className="spacer" />
        <select aria-label="Filter by status" style={{ padding: '.6rem 1rem', borderRadius: 12, border: '1px solid var(--line)' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>{APPT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {error && <div className="alert err">{error}</div>}
      <div className="table-wrap"><table className="t">
        <thead><tr><th>#</th><th>Received</th><th>Name</th><th>Service</th><th>Wants</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {shown.map((a) => (
            <tr key={a.id}>
              <td>#{a.request_no}</td><td>{fmtDate(a.created_at)}</td>
              <td><strong>{a.name}</strong><div className="muted" style={{ fontSize: '.82rem' }}>{a.phone}</div></td>
              <td>{a.service_name || <span className="muted">Not specified</span>}</td>
              <td>{a.preferred_date || '-'} {a.preferred_time}</td>
              <td><select aria-label={`Status of request ${a.request_no}`} value={a.status} onChange={(e) => update(a, { status: e.target.value })} style={{ padding: '.4rem .7rem', borderRadius: 10, border: '1px solid var(--line)' }}>{APPT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
              <td><button className="btn btn-ghost btn-sm" onClick={() => setView(a)}>Details</button></td>
            </tr>
          ))}
          {!shown.length && !loading && <tr><td colSpan="7" className="muted">No requests to show.</td></tr>}
        </tbody>
      </table></div>
      {view && (
        <Modal title={`Request #${view.request_no}`} onClose={() => setView(null)}>
          <p><Pill value={view.status} /> <span className="muted">{fmtDate(view.created_at)}</span></p>
          <p style={{ margin: 0 }}><strong>{view.name}</strong><br />{view.phone}{view.email && <><br />{view.email}</>}</p>
          <p>Service: <strong>{view.service_name || 'Not specified'}</strong><br />Preferred: {view.preferred_date || '-'} {view.preferred_time}</p>
          {view.message && <p><em>Message:</em> {view.message}</p>}
          <a className="btn btn-wa btn-sm" href={`https://wa.me/${String(view.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${view.name.split(' ')[0]}! About your appointment request #${view.request_no}.`)}`} target="_blank" rel="noopener noreferrer">WhatsApp customer</a>
          <form style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); update(view, { admin_notes: e.target.elements.notes.value }) }}>
            <div className="field"><label htmlFor="an">Private notes</label><textarea id="an" name="notes" defaultValue={view.admin_notes || ''} maxLength={1000} /></div>
            <button className="btn btn-primary btn-sm">Save notes</button>
          </form>
        </Modal>
      )}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  )
}
