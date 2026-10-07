import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Gallery from './pages/Gallery'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderPlaced from './pages/OrderPlaced'
import Book from './pages/Book'
import NotFound from './pages/NotFound'

// The admin panel is code-split: customers never download it.
const Admin = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="login-wrap">Loading…</div>}><Admin /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-placed" element={<OrderPlaced />} />
        <Route path="book" element={<Book />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
