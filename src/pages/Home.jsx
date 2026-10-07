import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { site, waLink } from '../config/site'
import { useAsync } from '../lib/useAsync'
import { listProducts, listGallery } from '../lib/api'
import Reveal from '../components/Reveal'
import Media from '../components/Media'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { SparkleIcon, InstaIcon } from '../components/Icons'

const pillars = [
  { to: '/book', title: 'Nail services & custom orders', text: 'Book an appointment in Vadodara and tell Sia what you have in mind.', cta: 'Request a booking' },
  { to: '/shop', title: 'Press-on nails', text: 'Ready-to-wear sets, available in Vadodara only.', cta: 'Shop press-ons' },
  { to: '/gallery', title: 'The gallery', text: 'A look at the nail sets and designs.', cta: 'See the gallery' },
]

export default function Home() {
  const products = useAsync(listProducts, [])
  const gallery = useAsync(listGallery, [])
  const featured = (products.data || []).filter((p) => p.is_featured).slice(0, 4)
  const shown = featured.length ? featured : (products.data || []).slice(0, 4)

  return (
    <>
      <Seo />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <m.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1 }}>
              {site.city ? `Nail studio · ${site.city}` : 'Nail studio'}
            </m.span>
            <m.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .15 }}>
              {site.name.split(' ').slice(0, -1).join(' ')}{' '}<span className="italic">{site.name.split(' ').slice(-1)}</span>
            </m.h1>
            <m.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .3 }}>
              {site.intro}
            </m.p>
            <m.div className="row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .45 }}>
              <Link to="/book" className="btn btn-primary">Book an appointment</Link>
              <Link to="/shop" className="btn btn-ghost">Shop press-ons</Link>
            </m.div>
          </div>
          <m.div className="hero-art" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: .2 }}>
            <Media src={site.images.hero} seed="hero" alt="Featured nail set" eager />
            <span className="sparkle" style={{ top: '12%', left: '10%' }}><SparkleIcon size={26} /></span>
            <span className="sparkle" style={{ bottom: '16%', right: '12%', animationDelay: '1.2s' }}><SparkleIcon size={20} /></span>
            <span className="sparkle" style={{ top: '40%', right: '8%', animationDelay: '2.1s' }}><SparkleIcon size={16} /></span>
          </m.div>
        </div>
      </section>

      <section className="section">
        <div className="container grid cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.to} delay={i * 0.1}>
              <Link to={p.to} className="card service-card" style={{ height: '100%' }}>
                <h3>{p.title}</h3>
                <p className="muted">{p.text}</p>
                <span className="italic">{p.cta} →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {shown.length > 0 && (
        <section className="section soft">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">The shop</span>
              <h2>Press-on <span className="italic">favourites</span></h2>
              <p>Order ready-to-wear sets. Available in Vadodara only.</p>
            </Reveal>
            <div className="grid cols-4">
              {shown.map((p, i) => <Reveal key={p.id} delay={i * 0.08}><ProductCard p={p} /></Reveal>)}
            </div>
            <Reveal className="center" style={{ marginTop: 36 }}><Link to="/shop" className="btn btn-ghost">View all press-ons</Link></Reveal>
          </div>
        </section>
      )}

      {(gallery.data || []).length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">Gallery</span>
              <h2>Recent <span className="italic">sets</span></h2>
            </Reveal>
            <div className="grid cols-3 gallery-mini">
              {gallery.data.slice(0, gallery.data.length >= 8 ? 8 : gallery.data.length >= 4 ? 4 : gallery.data.length).map((g, i) => (
                <Reveal key={g.id} delay={i * 0.06}>
                  <div className="product-card"><div className="media" style={{ aspectRatio: '1' }}><Media src={g.image_url} seed={g.id} alt={g.caption || 'Nail set'} ratio="square" /></div></div>
                </Reveal>
              ))}
            </div>
            <Reveal className="center" style={{ marginTop: 36 }}><Link to="/gallery" className="btn btn-ghost">See the full gallery</Link></Reveal>
          </div>
        </section>
      )}

      <section className="section soft">
        <div className="container hero-grid" style={{ alignItems: 'center' }}>
          <Reveal>
            <div className="hero-art" style={{ aspectRatio: '1', borderRadius: 'var(--radius)' }}>
              <Media src={site.images.about} seed="about" alt={site.about.title} ratio="square" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <span className="eyebrow">About</span>
            <h2>{site.about.title}</h2>
            <p className="muted">{site.about.body}</p>
            <a className="btn btn-ghost" href={site.instagramUrl} target="_blank" rel="noopener noreferrer"><InstaIcon /> Follow @{site.instagramHandle}</a>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <Reveal className="container center">
          <h2>Ready for a <span className="italic">fresh set?</span></h2>
          <p className="muted">Send a booking request, or message directly on WhatsApp.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/book" className="btn btn-primary">Request an appointment</Link>
            <a className="btn btn-wa" href={waLink('Hi! I would like to book a nail appointment.')} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </div>
        </Reveal>
      </section>
    </>
  )
}
