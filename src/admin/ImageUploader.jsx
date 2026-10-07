import { useRef, useState } from 'react'
import { uploadImage, removeImage } from '../lib/api'

/** Multi-image uploader. `value` is an array of public URLs. */
export default function ImageUploader({ value, onChange, folder, max = 8 }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const pick = async (e) => {
    const files = [...e.target.files].slice(0, max - value.length)
    e.target.value = ''
    if (!files.length) return
    setBusy(true); setErr('')
    try {
      const urls = []
      for (const f of files) urls.push(await uploadImage(f, folder))
      onChange([...value, ...urls])
    } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  const remove = async (url) => {
    onChange(value.filter((u) => u !== url))
    removeImage(url).catch(() => {})
  }
  const move = (i, d) => {
    const a = [...value]; const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    onChange(a)
  }
  return (
    <div className="field">
      <label>Photos {value.length ? `(first one is the cover)` : ''}</label>
      <div className="img-strip">
        {value.map((u, i) => (
          <div className="im" key={u}>
            <img src={u} alt={`Photo ${i + 1}`} />
            <button type="button" onClick={() => remove(u)} aria-label={`Remove photo ${i + 1}`}>×</button>
            {i > 0 && <button type="button" style={{ top: 'auto', bottom: 4, right: 'auto', left: 4 }} onClick={() => move(i, -1)} aria-label="Move earlier">←</button>}
          </div>
        ))}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={pick} />
      <div className="row">
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || value.length >= max} onClick={() => input.current.click()}>
          {busy ? 'Uploading…' : '＋ Upload photos'}
        </button>
        <span className="hint">JPG/PNG/WebP, auto-resized for speed. Up to {max}.</span>
      </div>
      {err && <span className="err" role="alert">{err}</span>}
    </div>
  )
}
