import { useState } from 'react'
import { fmtPrice } from '../config/site'
import { adminDelete, adminPatch, adminSave, removeImage } from '../lib/api'
import { slugify } from '../lib/utils'
import { useAdminList, Modal, Confirm, Check } from './ui'
import ImageUploader from './ImageUploader'
import Toast from '../components/Toast'

const blank = { name: '', slug: '', category: 'Press-ons', price: '', compare_at_price: '', description: '', sizes: '', images: [], is_available: true, is_published: true, is_featured: false, sort_order: 0 }

export function toProductRow(f) {
  const price = f.price === '' ? null : Number(f.price)
  if (!f.name.trim()) throw new Error('Please enter a name.')
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('Please enter a valid price, or leave it blank for “Price on request”.')
  const cmp = f.compare_at_price === '' ? null : Number(f.compare_at_price)
  if (cmp !== null && (!Number.isFinite(cmp) || cmp < 0)) throw new Error('Compare-at price is not valid.')
  const slug = slugify(f.slug || f.name)
  if (!slug) throw new Error('Please enter a name or web address.')
  return {
    ...(f.id ? { id: f.id } : {}),
    name: f.name.trim(), slug, category: f.category.trim() || 'Press-ons', price, compare_at_price: cmp,
    description: f.description, images: f.images,
    size_options: [...new Set(f.sizes.split(',').map((s) => s.trim()).filter(Boolean))],
    is_available: f.is_available, is_published: f.is_published, is_featured: f.is_featured,
    sort_order: parseInt(f.sort_order, 10) || 0,
  }
}

export default function ProductsAdmin() {
  const { rows, loading, error, reload } = useAdminList('products', [['sort_order', true], ['created_at', false]])
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const open = (p) => setEdit(p ? { ...p, sizes: (p.size_options || []).join(', '), price: p.price == null ? '' : String(p.price), compare_at_price: p.compare_at_price ?? '', images: p.images || [] } : { ...blank })
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value // read now, not inside the updater
    setEdit((s) => ({ ...s, [k]: v }))
  }

  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await adminSave('products', toProductRow(edit)); setEdit(null); setToast('Saved'); reload() }
    catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const toggle = async (p, k) => { try { await adminPatch('products', p.id, { [k]: !p[k] }); reload() } catch (ex) { setToast(ex.message) } }
  const remove = async () => {
    try {
      await adminDelete('products', del.id)
      ;(del.images || []).forEach((u) => removeImage(u).catch(() => {}))
      setDel(null); setToast('Deleted'); reload()
    } catch (ex) { setToast(ex.message); setDel(null) }
  }

  return (
    <>
      <div className="row"><h1>Products</h1><span className="spacer" /><button className="btn btn-primary" onClick={() => open(null)}>＋ Add product</button></div>
      {error && <div className="alert err">{error}</div>}
      <div className="table-wrap"><table className="t">
        <thead><tr><th></th><th>Name</th><th>Price</th><th>Available</th><th>Visible</th><th></th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>{p.images?.[0] ? <img className="thumb" src={p.images[0]} alt="" /> : <div className="thumb" />}</td>
              <td><strong>{p.name}</strong><div className="muted" style={{ fontSize: '.8rem' }}>/{p.slug}</div></td>
              <td>{p.price != null ? fmtPrice(p.price) : <span className="muted">On request</span>}</td>
              <td><button className={`badge ${p.is_available ? 'ok' : 'mute'}`} style={{ border: 0 }} onClick={() => toggle(p, 'is_available')} title="Click to toggle">{p.is_available ? 'In stock' : 'Sold out'}</button></td>
              <td><button className={`badge ${p.is_published ? 'ok' : 'mute'}`} style={{ border: 0 }} onClick={() => toggle(p, 'is_published')} title="Click to toggle">{p.is_published ? 'Shown' : 'Hidden'}</button></td>
              <td className="row" style={{ flexWrap: 'nowrap' }}><button className="btn btn-ghost btn-sm" onClick={() => open(p)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => setDel(p)}>Delete</button></td>
            </tr>
          ))}
          {!rows.length && !loading && <tr><td colSpan="6" className="muted">No products yet. Add your first one.</td></tr>}
        </tbody>
      </table></div>

      {edit && (
        <Modal title={edit.id ? 'Edit product' : 'New product'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            {err && <div className="alert err" role="alert">{err}</div>}
            <div className="field"><label htmlFor="pn">Name *</label><input id="pn" value={edit.name} onChange={set('name')} maxLength={120} required /></div>
            <div className="field-row">
              <div className="field"><label htmlFor="pp">Price (₹)</label><input id="pp" type="number" min="0" step="1" inputMode="decimal" value={edit.price} onChange={set('price')} /><span className="hint">Blank shows “Price on request” (can’t be added to the bag).</span></div>
              <div className="field"><label htmlFor="pc">Old price (optional)</label><input id="pc" type="number" min="0" step="1" value={edit.compare_at_price} onChange={set('compare_at_price')} /><span className="hint">Shown crossed out if higher than the price.</span></div>
            </div>
            <div className="field-row">
              <div className="field"><label htmlFor="pk">Category</label><input id="pk" value={edit.category} onChange={set('category')} maxLength={60} /></div>
              <div className="field"><label htmlFor="ps">Web address</label><input id="ps" value={edit.slug} onChange={set('slug')} placeholder={slugify(edit.name) || 'auto'} /><span className="hint">Leave blank to generate from the name.</span></div>
            </div>
            <div className="field"><label htmlFor="pd">Description</label><textarea id="pd" value={edit.description} onChange={set('description')} maxLength={4000} /></div>
            <div className="field"><label htmlFor="pz">Sizes (comma separated, optional)</label><input id="pz" value={edit.sizes} onChange={set('sizes')} placeholder="XS, S, M, L" /><span className="hint">Leave blank if the product has no size choice.</span></div>
            <ImageUploader value={edit.images} onChange={(images) => setEdit((s) => ({ ...s, images }))} folder="products" />
            <Check id="ca" label="In stock (untick to show “Sold out”)" checked={edit.is_available} onChange={set('is_available')} />
            <Check id="cp" label="Visible on the website" checked={edit.is_published} onChange={set('is_published')} />
            <Check id="cf" label="Feature on the home page" checked={edit.is_featured} onChange={set('is_featured')} />
            <div className="field"><label htmlFor="po">Display order (small numbers first)</label><input id="po" type="number" value={edit.sort_order} onChange={set('sort_order')} /></div>
            <div className="row"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
      {del && <Confirm message={`Delete “${del.name}”? This also removes its photos and cannot be undone.`} onYes={remove} onNo={() => setDel(null)} />}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  )
}
