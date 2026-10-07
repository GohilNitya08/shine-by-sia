import { supabase, isConfigured, BUCKET } from './supabase'
import { sampleProducts, sampleServices, sampleGallery } from './sampleData'
import { compressImage } from './image'

/* ---------------- tiny cache so navigating feels instant ---------------- */
const cache = new Map()
const TTL = 60_000
async function cached(key, fn) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.t < TTL) return hit.v
  const v = await fn()
  cache.set(key, { v, t: Date.now() })
  return v
}
export const clearCache = () => cache.clear()

const friendly = (error, fallback = 'Something went wrong. Please try again.') => {
  const msg = error?.message || ''
  // Our RPC functions raise human-readable messages; show those. Hide anything technical.
  if (error?.code === 'P0001' && msg) return msg
  return fallback
}

/* ---------------- public reads ---------------- */
export const listProducts = () =>
  cached('products', async () => {
    if (!isConfigured) return sampleProducts
    const { data, error } = await supabase
      .from('products').select('*').eq('is_published', true)
      .order('sort_order').order('created_at', { ascending: false })
    if (error) throw new Error('Could not load products.')
    return data
  })

export const getProduct = async (slug) => (await listProducts()).find((p) => p.slug === slug) || null

export const listServices = () =>
  cached('services', async () => {
    if (!isConfigured) return sampleServices
    const { data, error } = await supabase
      .from('services').select('*').eq('is_active', true).order('sort_order')
    if (error) throw new Error('Could not load services.')
    return data
  })

export const listGallery = () =>
  cached('gallery', async () => {
    if (!isConfigured) return sampleGallery
    const { data, error } = await supabase
      .from('gallery_items').select('*').eq('is_visible', true)
      .order('sort_order').order('created_at', { ascending: false })
    if (error) throw new Error('Could not load the gallery.')
    return data
  })

/* ---------------- public writes (server-validated RPCs) ---------------- */
export async function placeOrder(customer, items) {
  const lines = items.map((i) => ({ product_id: i.productId, qty: i.qty, size: i.size || null }))
  if (!isConfigured) {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    return { order_no: 'DEMO', total, demo: true }
  }
  const { data, error } = await supabase.rpc('place_order', { p_customer: customer, p_items: lines })
  if (error) throw new Error(friendly(error, 'We could not place your order. Please try again.'))
  clearCache()
  return data
}

export async function requestAppointment(payload) {
  if (!isConfigured) return { request_no: 'DEMO', demo: true }
  const { data, error } = await supabase.rpc('request_appointment', { p: payload })
  if (error) throw new Error(friendly(error, 'We could not send your request. Please try again.'))
  return data
}

/* ---------------- admin auth ---------------- */
export const adminAuth = {
  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Incorrect email or password.')
    const ok = await adminAuth.isAdmin()
    if (!ok) {
      await supabase.auth.signOut()
      throw new Error('This account does not have admin access.')
    }
  },
  signOut: () => supabase.auth.signOut(),
  async session() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },
  async isAdmin() {
    const { data, error } = await supabase.rpc('is_admin')
    return !error && data === true
  },
  onChange: (cb) => supabase.auth.onAuthStateChange((_e, s) => cb(s)).data.subscription,
}

/* ---------------- admin data ---------------- */
export async function adminList(table, order = [['created_at', false]]) {
  let q = supabase.from(table).select('*')
  order.forEach(([col, asc]) => { q = q.order(col, { ascending: asc }) })
  const { data, error } = await q
  if (error) throw new Error(`Could not load ${table}.`)
  return data
}

export async function adminSave(table, row) {
  const { id, ...rest } = row
  const q = id
    ? supabase.from(table).update(rest).eq('id', id).select().single()
    : supabase.from(table).insert(rest).select().single()
  const { data, error } = await q
  if (error) {
    if (error.code === '23505') throw new Error('That web address (slug) is already used by another item.')
    throw new Error(error.message || 'Could not save.')
  }
  clearCache()
  return data
}

export async function adminDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error('Could not delete.')
  clearCache()
}

export async function adminPatch(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single()
  if (error) throw new Error('Could not update.')
  clearCache()
  return data
}

/* ---------------- image storage ---------------- */
export async function uploadImage(file, folder = 'misc') {
  const blob = await compressImage(file)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/webp', cacheControl: '31536000',
  })
  if (error) throw new Error('Upload failed. Check that you are signed in as admin.')
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export async function removeImage(url) {
  const marker = `/object/public/${BUCKET}/`
  const i = String(url).indexOf(marker)
  if (i === -1) return // external / placeholder image, nothing to delete
  await supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))])
}
