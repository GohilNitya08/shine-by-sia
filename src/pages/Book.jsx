import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { site, waLink } from '../config/site'
import { useAsync } from '../lib/useAsync'
import { listServices, requestAppointment } from '../lib/api'
import { isEmail, isPhone } from '../lib/utils'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'
import Field from '../components/Field'
import { InstaIcon } from '../components/Icons'

const today = () => new Date().toISOString().slice(0, 10)
const empty = { name: '', phone: '', email: '', service_id: '', preferred_date: '', preferred_time: '', message: '', website: '' }

export function validateBooking(f) {
  const e = {}
  if (f.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!isPhone(f.phone)) e.phone = 'Enter a valid phone number.'
  if (f.email.trim() && !isEmail(f.email)) e.email = 'Enter a valid email or leave it blank.'
  if (f.preferred_date && f.preferred_date < today()) e.preferred_date = 'Please choose a future date.'
  return e
}

export default function Book() {
  const [params] = useSearchParams()
  const { data: services } = useAsync(listServices, [])
  const [f, setF] = useState({ ...empty, service_id: params.get('service') || '' })
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')
  const [done, setDone] = useState(null)
  const serviceParam = params.get('service') || ''
  useEffect(() => { if (serviceParam) setF((x) => (x.service_id === serviceParam ? x : { ...x, service_id: serviceParam })) }, [serviceParam])
  const set = (k) => (e) => {
    const v = e.target.value // read now, not inside the updater
    setF((s) => ({ ...s, [k]: v }))
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (f.website) return
    const e = validateBooking(f)
    setErrs(e)
    if (Object.keys(e).length) return
    setBusy(true); setFail('')
    try {
      const { website, ...payload } = f
      const res = await requestAppointment(payload)
      const svc = (services || []).find((s) => s.id === f.service_id)
      setDone({ ...res, name: f.name, service: svc?.name, date: f.preferred_date })
    } catch (err) { setFail(err.message) } finally { setBusy(false) }
  }

  if (done) {
    const msg = `Hi! I just sent an appointment request (#${done.request_no}). I'm ${done.name}${done.service ? ` and I'm interested in: ${done.service}` : ''}${done.date ? `, around ${done.date}` : ''}.`
    return (
      <div className="container page-pad center" style={{ maxWidth: 620 }}>
        <Seo title="Request sent" />
        <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)' }}>Request <span className="italic">received</span></h1>
        {done.demo && <div className="alert info">Demo mode: Supabase is not connected, so this was not saved.</div>}
        <p>Thank you, {done.name.split(' ')[0]}. Sia will get back to you to confirm a time. Nothing is booked until she confirms.</p>
        <a className="btn btn-wa" href={waLink(msg)} target="_blank" rel="noopener noreferrer">Also message on WhatsApp</a>
      </div>
    )
  }


  return (
    <div className="container page-pad">
      <Seo title="Book an appointment" description="Send an appointment request. Available in Vadodara only." />
      <Reveal className="section-head">
        <span className="eyebrow">Appointments</span>
        <h1 style={{ fontSize: 'clamp(2.4rem,6vw,4rem)' }}>Book a <span className="italic">set</span></h1>
        <p>Send a request with your preferred day. Sia will confirm availability and the final time with you.</p>
        <p className="muted"><strong>{site.serviceAreaNote}</strong></p>
      </Reveal>
      <div className="split">
        <form className="card" onSubmit={submit} noValidate>
          {fail && <div className="alert err" role="alert">{fail}</div>}
          <div className="field-row">
            <Field id="name" value={f.name} onChange={set('name')} error={errs.name} label="Your name" req autoComplete="name" />
            <Field id="phone" value={f.phone} onChange={set('phone')} error={errs.phone} label="Phone / WhatsApp" req type="tel" autoComplete="tel" inputMode="tel" />
          </div>
          <Field id="email" value={f.email} onChange={set('email')} error={errs.email} label="Email (optional)" type="email" autoComplete="email" />
          <div className="field">
            <label htmlFor="service_id">Service</label>
            <select id="service_id" value={f.service_id} onChange={set('service_id')}>
              <option value="">Not sure yet / custom request</option>
              {(services || []).filter((s) => !s.is_addon).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field-row">
            <Field id="preferred_date" value={f.preferred_date} onChange={set('preferred_date')} error={errs.preferred_date} label="Preferred date" type="date" min={today()} />
            <Field id="preferred_time" value={f.preferred_time} onChange={set('preferred_time')} error={errs.preferred_time} label="Preferred time" placeholder="e.g. afternoon" maxLength={40} />
          </div>
          <div className="field">
            <label htmlFor="message">Tell Sia about your idea</label>
            <textarea id="message" value={f.message} onChange={set('message')} maxLength={1500} placeholder="Colours, length, shape, inspiration…" />
          </div>
          <div className="hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
        </form>
        <aside className="card">
          <h3>Prefer to chat?</h3>
          <p className="muted">Message directly, whichever is easiest.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            <a className="btn btn-wa" href={waLink('Hi! I would like to book a nail appointment.')} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a className="btn btn-ghost" href={site.instagramUrl} target="_blank" rel="noopener noreferrer"><InstaIcon /> Instagram DM @{site.instagramHandle}</a>
          </div>
        </aside>
      </div>
    </div>
  )
}
