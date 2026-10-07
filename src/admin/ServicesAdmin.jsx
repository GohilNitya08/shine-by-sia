import { useState } from 'react'
import { fmtPrice } from '../config/site'
import { adminDelete, adminPatch, adminSave } from '../lib/api'
import { useAdminList, Modal, Confirm, Check } from './ui'
import Toast from '../components/Toast'

const blank = { name: '', description: '', price_from: '', duration_minutes: '', is_addon: false, is_active: true, sort_order: 0 }

export function toServiceRow(f) {
  if (!f.name.trim()) throw new Error('Please enter a name.')
  const price = f.price_from === '' ? null : Number(f.price_from)
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('Please enter a valid price, or leave it blank.')
  const dur = f.duration_minutes === '' ? null : parseInt(f.duration_minutes, 10)
  if (dur !== null && (!(dur >= 5 && dur <= 600))) throw new Error('Duration must be between 5 and 600 minutes.')
  return {
    ...(f.id ? { id: f.id } : {}),
    name: f.name.trim(), description: f.description, price_from: price, duration_minutes: dur, is_addon: !!f.is_addon,
    is_active: f.is_active, sort_order: parseInt(f.sort_order, 10) || 0,
  }
}

export default function ServicesAdmin() {
  const { rows, loading, error, reload } = useAdminList('services', [['sort_order', true], ['created_at', true]])
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value // read now, not inside the updater
    setEdit((s) => ({ ...s, [k]: v }))
  }
  const open = (s) => setEdit(s ? { ...s, price_from: s.price_from ?? '', duration_minutes: s.duration_minutes ?? '' } : { ...blank })

  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await adminSave('services', toServiceRow(edit)); setEdit(null); setToast('Saved'); reload() }
    catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    try { await adminDelete('services', del.id); setToast('Deleted'); reload() } catch (ex) { setToast(ex.message) }
    setDel(null)
  }

  return (
    <>
      <div className="row"><h1>Services</h1><span className="spacer" /><button className="btn btn-primary" onClick={() => open(null)}>＋ Add service</button></div>
      {error && <div className="alert err">{error}</div>}
      <div className="table-wrap"><table className="t">
        <thead><tr><th>Name</th><th>From</th><th>Duration</th><th>Visible</th><th></th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.name}</strong><div className="muted" style={{ fontSize: '.82rem', maxWidth: 360 }}>{s.description?.slice(0, 90)}</div></td>
              <td>{s.price_from != null ? `${s.is_addon ? '+' : ''}${fmtPrice(s.price_from)}` : <span className="muted">On request</span>}</td>
              <td>{s.duration_minutes ? `${s.duration_minutes} min` : '-'}</td>
              <td><button className={`badge ${s.is_active ? 'ok' : 'mute'}`} style={{ border: 0 }} onClick={async () => { await adminPatch('services', s.id, { is_active: !s.is_active }); reload() }}>{s.is_active ? 'Shown' : 'Hidden'}</button></td>
              <td className="row" style={{ flexWrap: 'nowrap' }}><button className="btn btn-ghost btn-sm" onClick={() => open(s)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => setDel(s)}>Delete</button></td>
            </tr>
          ))}
          {!rows.length && !loading && <tr><td colSpan="5" className="muted">No services yet.</td></tr>}
        </tbody>
      </table></div>
      {edit && (
        <Modal title={edit.id ? 'Edit service' : 'New service'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            {err && <div className="alert err" role="alert">{err}</div>}
            <div className="field"><label htmlFor="sn">Name *</label><input id="sn" value={edit.name} onChange={set('name')} maxLength={120} required /></div>
            <div className="field"><label htmlFor="sd">Description</label><textarea id="sd" value={edit.description} onChange={set('description')} maxLength={2000} /></div>
            <div className="field-row">
              <div className="field"><label htmlFor="sp">Starting price (₹)</label><input id="sp" type="number" min="0" value={edit.price_from} onChange={set('price_from')} /><span className="hint">Blank shows “Price on request”.</span></div>
              <div className="field"><label htmlFor="sm">Duration (minutes)</label><input id="sm" type="number" min="5" max="600" value={edit.duration_minutes} onChange={set('duration_minutes')} /></div>
            </div>
            <Check id="sx" label="This is an add-on (shown as “+ ₹price”, not booked on its own)" checked={!!edit.is_addon} onChange={set('is_addon')} />
            <Check id="sa" label="Visible on the website" checked={edit.is_active} onChange={set('is_active')} />
            <div className="field"><label htmlFor="so">Display order</label><input id="so" type="number" value={edit.sort_order} onChange={set('sort_order')} /></div>
            <div className="row"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
      {del && <Confirm message={`Delete “${del.name}”?`} onYes={remove} onNo={() => setDel(null)} />}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  )
}
