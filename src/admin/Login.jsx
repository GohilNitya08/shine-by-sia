import { useState } from 'react'
import { adminAuth } from '../lib/api'
import { site } from '../config/site'

export default function Login({ onDone }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await adminAuth.signIn(email.trim(), pw); onDone() }
    catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }
  return (
    <div className="login-wrap">
      <form className="card" onSubmit={submit}>
        <h1 style={{ fontSize: '2.2rem' }}>{site.name}</h1>
        <p className="muted">Admin sign in</p>
        {err && <div className="alert err" role="alert">{err}</div>}
        <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
