import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { useAsync } from '../lib/useAsync'
import { listGallery } from '../lib/api'
import Reveal from '../components/Reveal'
import Media from '../components/Media'
import Seo from '../components/Seo'
import { Loading, ErrorBox } from '../components/State'
import { site } from '../config/site'
import { InstaIcon } from '../components/Icons'

export default function Gallery() {
  const { data, error, loading } = useAsync(listGallery, [])
  const [open, setOpen] = useState(null)
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])
  return (
    <div className="container page-pad">
      <Seo title="Gallery" description="Nail art gallery." />
      <Reveal className="section-head">
        <span className="eyebrow">Gallery</span>
        <h1 style={{ fontSize: 'clamp(2.4rem,6vw,4rem)' }}>Nail <span className="italic">gallery</span></h1>
        <p>A look at the designs. More on Instagram.</p>
      </Reveal>
      {loading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && data.length === 0 && <p className="center muted">Photos coming soon.</p>}
      <div className="gallery-grid">
        {(data || []).map((g, i) => (
          <Reveal key={g.id} delay={(i % 6) * 0.05}>
            <button className="gallery-item" onClick={() => setOpen(g)} aria-label={`Open ${g.caption || 'photo'}`}>
              <Media src={g.image_url} seed={g.id} alt={g.caption || 'Nail set'} ratio={i % 3 === 0 ? 'portrait' : 'square'} />
            </button>
          </Reveal>
        ))}
      </div>
      <p className="center" style={{ marginTop: 32 }}>
        <a className="btn btn-ghost" href={site.instagramUrl} target="_blank" rel="noopener noreferrer"><InstaIcon /> More on Instagram</a>
      </p>
      <AnimatePresence>
        {open && (
          <m.div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <button className="close-x" aria-label="Close" onClick={() => setOpen(null)}>×</button>
            <m.div className="frame" initial={{ scale: .92 }} animate={{ scale: 1 }} exit={{ scale: .95 }} onClick={(e) => e.stopPropagation()}>
              <Media src={open.image_url} seed={open.id} alt={open.caption || 'Nail set'} tag={false} />
              {open.caption && <div className="cap">{open.caption}</div>}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
