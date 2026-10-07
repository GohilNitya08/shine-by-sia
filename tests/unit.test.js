import { describe, expect, it } from 'vitest'
import { slugify, isPhone, isEmail } from '../src/lib/utils'
import { validateCheckout } from '../src/pages/Checkout'
import { validateBooking } from '../src/pages/Book'
import { toProductRow } from '../src/admin/ProductsAdmin'
import { toServiceRow } from '../src/admin/ServicesAdmin'
import { fmtPrice, waLink } from '../src/config/site'

describe('utils', () => {
  it('slugifies', () => {
    expect(slugify('Rosé Glaze  Set!')).toBe('rose-glaze-set')
    expect(slugify('  --Hello--  ')).toBe('hello')
    expect(slugify('')).toBe('')
  })
  it('validates phone and email', () => {
    expect(isPhone('+91 98765 43210')).toBe(true)
    expect(isPhone('abc')).toBe(false)
    expect(isPhone('12')).toBe(false)
    expect(isEmail('a@b.co')).toBe(true)
    expect(isEmail('nope')).toBe(false)
  })
})

describe('checkout validation', () => {
  const ok = { name: 'Asha Patel', phone: '9876543210', email: '', address_line: '12 Rose Lane', city: 'Vadodara', state: '', pincode: '390001' }
  it('accepts a valid form', () => expect(validateCheckout(ok)).toEqual({}))
  it('flags every missing field', () => {
    const e = validateCheckout({ ...ok, name: '', phone: 'x', address_line: '', city: '', pincode: '' })
    expect(Object.keys(e).sort()).toEqual(['address_line', 'city', 'name', 'phone', 'pincode'])
  })
  it('rejects a bad optional email', () => expect(validateCheckout({ ...ok, email: 'bad' }).email).toBeTruthy())
})

describe('booking validation', () => {
  it('rejects past dates and bad phone', () => {
    const e = validateBooking({ name: 'A', phone: '1', email: '', preferred_date: '2000-01-01' })
    expect(Object.keys(e).sort()).toEqual(['name', 'phone', 'preferred_date'])
  })
  it('accepts a minimal request', () => expect(validateBooking({ name: 'Asha', phone: '9876543210', email: '', preferred_date: '' })).toEqual({}))
})

describe('admin row builders', () => {
  const f = { name: 'Rose Set', slug: '', category: '', price: '799', compare_at_price: '', description: 'x', sizes: 'S, M, , S', images: ['a'], is_available: true, is_published: true, is_featured: false, sort_order: '2' }
  it('builds a product row', () => {
    const r = toProductRow(f)
    expect(r).toMatchObject({ slug: 'rose-set', price: 799, compare_at_price: null, category: 'Press-ons', size_options: ['S', 'M'], sort_order: 2 })
  })
  it('rejects bad product input', () => {
    expect(() => toProductRow({ ...f, name: ' ' })).toThrow()
    expect(toProductRow({ ...f, price: '' }).price).toBeNull()
    expect(() => toProductRow({ ...f, price: '-5' })).toThrow()
    expect(() => toProductRow({ ...f, compare_at_price: 'x' })).toThrow()
  })
  it('builds a service row with optional price', () => {
    expect(toServiceRow({ name: 'Gel', description: '', price_from: '', duration_minutes: '', is_active: true, sort_order: '' })).toMatchObject({ price_from: null, duration_minutes: null, sort_order: 0 })
    expect(() => toServiceRow({ name: 'Gel', price_from: '', duration_minutes: '2', is_active: true })).toThrow()
    expect(toServiceRow({ name: 'Cat Eye', price_from: '50', duration_minutes: '', is_addon: true, is_active: true, sort_order: 7 })).toMatchObject({ price_from: 50, is_addon: true })
  })
})

describe('site helpers', () => {
  it('formats rupees', () => expect(fmtPrice(1299)).toContain('1,299'))
  it('builds a WhatsApp link with encoded text', () => expect(waLink('hi there')).toContain('text=hi%20there'))
})
