import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { site, waLink } from '../config/site'
import { useCart } from '../lib/cart'
import { BagIcon, MenuIcon, CloseIcon, InstaIcon, WaIcon } from './Icons'

const links = [
  ['/', 'Home'], ['/services', 'Services'], ['/gallery', 'Gallery'], ['/shop', 'Shop'], ['/book', 'Book'],
]

function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { count } = useCart()
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const cartBtn = (cls = '') => (
    <Link to="/cart" className={`cart-btn ${cls}`} aria-label={`Cart, ${count} items`}>
      <BagIcon />{count > 0 && <span className="count">{count}</span>}
    </Link>
  )
  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-in">
        <Link to="/" className="logo" aria-label={`${site.name} home`}>
          {site.name.split(' ').slice(0, -1).join(' ')} <span>{site.name.split(' ').slice(-1)}</span>
        </Link>
        {cartBtn('mobile')}
        <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `link ${isActive ? 'active' : ''}`}>{label}</NavLink>
          ))}
          {cartBtn()}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <h4>{site.name}</h4>
            <p style={{ opacity: .8 }}>{site.tagline}</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>{links.map(([to, l]) => <li key={to}><Link to={to}>{l}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li><a href={waLink('Hi! I found you through your website.')} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram @{site.instagramHandle}</a></li>
              {site.email && <li><a href={`mailto:${site.email}`}>{site.email}</a></li>}
              {site.city && <li style={{ opacity: .8 }}>{site.city}</li>}
              {site.serviceAreaNote && <li style={{ opacity: .8 }}>{site.serviceAreaNote}</li>}
            </ul>
          </div>
        </div>
        <div className="copy">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>
      <Header />
      {/* Enter-only fade: an exit animation would render the NEW route inside the old wrapper (two copies at once). */}
      <m.main id="main" key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <Outlet />
      </m.main>
      <Footer />
      <a className="wa-float" href={waLink('Hi! I would like to know more.')} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><WaIcon /></a>
      {site.showPlaceholderBadge && <div className="placeholder-ribbon">Sample content: replace with real photos</div>}
    </>
  )
}
export { InstaIcon }
