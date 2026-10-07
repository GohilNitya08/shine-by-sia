import { useRef, useState } from 'react'
import { adminDelete, adminPatch, adminSave, removeImage, uploadImage } from '../lib/api'
import { useAdminList, Confirm } from './ui'
import Toast from '../components/Toast'

export default function GalleryAdmin() {
  const { rows, loading, error, reload } = useAdminList('gallery_items', [['sort_order', true], ['created_at', false]])
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [del, setDel] = useState(null)
  const [toast, setToast] = useState('')

  const upload = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    try {
      for (const f of files) {
        const url = await uploadImage(f, 'gallery')
        await adminSave('gallery_items', { image_url: url, caption: '', is_visible: true, sort_order: 0 })
      }
      setToast(`${files.length} photo${files.length > 1 ? 's' : ''} added`); reload()
    } catch (ex) { setToast(ex.message) } finally { setBusy(false) }
  }
  const caption = async (g, v) => { if (v !== g.caption) { try { await adminPatch('gallery_items', g.id, { caption: v.slice(0, 200) }); setToast('Saved') } catch (ex) { setToast(ex.message) } } }
  const remove = async () => {
    try { await adminDelete('gallery_items', del.id); removeImage(del.image_url).catch(() => {}); setToast('Deleted'); reload() } catch (ex) { setToast(ex.message) }
    setDel(null)
  }

  return (
    <>
      <div className="row"><h1>Gallery</h1><span className="spacer" />
        <input ref={input} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} />
        <button className="btn btn-primary" disabled={busy} onClick={() => input.current.click()}>{busy ? 'Uploading…' : '＋ Upload photos'}</button>
      </div>
      {error && <div className="alert err">{error}</div>}
      {!rows.length && !loading && <p className="muted">No photos yet. Upload some to fill the gallery.</p>}
      <div className="grid cols-4">
        {rows.map((g) => (
          <div className="card" key={g.id} style={{ padding: 12 }}>
            <img src={g.image_url} alt={g.caption || 'Gallery photo'} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12 }} loading="lazy" />
            <div className="field" style={{ margin: '10px 0 8px' }}><input aria-label="Caption" defaultValue={g.caption} maxLength={200} placeholder="Caption (optional)" onBlur={(e) => caption(g, e.target.value)} /></div>
            <div className="row">
              <button className={`badge ${g.is_visible ? 'ok' : 'mute'}`} style={{ border: 0 }} onClick={async () => { await adminPatch('gallery_items', g.id, { is_visible: !g.is_visible }); reload() }}>{g.is_visible ? 'Shown' : 'Hidden'}</button>
              <span className="spacer" />
              <button className="btn btn-danger btn-sm" onClick={() => setDel(g)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {del && <Confirm message="Delete this photo? This cannot be undone." onYes={remove} onNo={() => setDel(null)} />}
      <Toast message={toast} onDone={() => setToast('')} />
    </>
  )
}
