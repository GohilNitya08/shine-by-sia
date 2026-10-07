import { useMemo, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { listProducts } from '../lib/api'
import Reveal from '../components/Reveal'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { Loading, ErrorBox } from '../components/State'

export default function Shop() {
  const { data, error, loading } = useAsync(listProducts, [])
  const [cat, setCat] = useState('All')
  const cats = useMemo(() => ['All', ...new Set((data || []).map((p) => p.category).filter(Boolean))], [data])
  const items = (data || []).filter((p) => cat === 'All' || p.category === cat)
  return (
    <div className="container page-pad">
      <Seo title="Press-on nails" description="Shop press-on nail sets." />
      <Reveal className="section-head">
        <span className="eyebrow">The shop</span>
        <h1 style={{ fontSize: 'clamp(2.4rem,6vw,4rem)' }}>Press-on <span className="italic">nails</span></h1>
        <p>Ready-to-wear sets. No account needed. Check out as a guest.</p>
        <p className="muted"><strong>Press-on nails are available in Vadodara only and are not shipped outside Vadodara.</strong></p>
      </Reveal>
      {cats.length > 2 && (
        <div className="chips" style={{ justifyContent: 'center' }} role="group" aria-label="Filter by category">
          {cats.map((c) => <button key={c} className={`chip ${c === cat ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      )}
      {loading && <Loading rows={4} />}
      {error && <ErrorBox error={error} />}
      {data && items.length === 0 && <p className="center muted">New sets are coming soon.</p>}
      <div className="grid cols-4">
        {items.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 0.06}><ProductCard p={p} /></Reveal>)}
      </div>
    </div>
  )
}
