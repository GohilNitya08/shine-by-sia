import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Refuse to run if someone pasted a SECRET key into the browser app. */
function looksSecret(k) {
  if (!k) return false
  if (k.startsWith('sb_secret_')) return true
  try {
    const payload = JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

if (looksSecret(key)) {
  throw new Error(
    'SECURITY: VITE_SUPABASE_ANON_KEY contains a secret/service-role key. ' +
      'Use only the public anon (publishable) key in the website. Rotate the leaked key in Supabase.'
  )
}

export const isConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT'))
export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
export const BUCKET = 'media'
