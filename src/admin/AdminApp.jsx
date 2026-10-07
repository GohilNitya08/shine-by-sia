import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { isConfigured } from '../lib/supabase'
import { adminAuth } from '../lib/api'
import { site } from '../config/site'
import Login from './Login'
import Dashboard from './Dashboard'
import ProductsAdmin from './ProductsAdmin'
import ServicesAdmin from './ServicesAdmin'
import GalleryAdmin from './GalleryAdmin'
import OrdersAdmin from './OrdersAdmin'
import AppointmentsAdmin from './AppointmentsAdmin'

const nav = [
  ['/admin', 'Dashboard', true], ['/admin/orders', 'Orders'], ['/admin/appointments', 'Appointments'],
  ['/admin/products', 'Products'], ['/admin/services', 'Services'], ['/admin/gallery', 'Gallery'],
]

export default function AdminApp() {
  const [status, setStatus] = useState('checking') // checking | out | in
  const check = async () => {
    const s = await adminAuth.session()
    setStatus(s && (await adminAuth.isAdmin()) ? 'in' : 'out')
  }
  useEffect(() => {
    if (!isConfigured) return
    check()
    const sub = adminAuth.onChange((s) => { if (!s) setStatus('out') })
    return () => sub.unsubscribe()
  }, [])

  if (!isConfigured) return (
    <div className="login-wrap"><div className="card" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: '2rem' }}>Admin needs Supabase</h1>
      <p>This site is running in demo mode. To use the admin panel, create a Supabase project, run <code>supabase/schema.sql</code>, and add your public URL and anon key to <code>.env</code>. Step-by-step instructions are in the README.</p>
    </div></div>
  )
  if (status === 'checking') return <div className="login-wrap">Loading…</div>
  if (status === 'out') return <Login onDone={() => setStatus('in')} />

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="logo">{site.shortName}<span> admin</span></div>
        {nav.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>)}
        <span className="spacer" />
        <a href="/" target="_blank" rel="noopener noreferrer">View site ↗</a>
        <a href="#out" onClick={async (e) => { e.preventDefault(); await adminAuth.signOut(); setStatus('out') }}>Sign out</a>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="appointments" element={<AppointmentsAdmin />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}
