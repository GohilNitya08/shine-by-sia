import { Link } from 'react-router-dom'
import { fmtPrice, site } from '../config/site'
import { useAsync } from '../lib/useAsync'
import { listServices } from '../lib/api'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'
import { Loading, ErrorBox } from '../components/State'

export default function Services() {
  const { data, error, loading } = useAsync(listServices, [])
  return (
    <div className="container page-pad">
      <Seo title="Services" description="Nail services in Vadodara. Available in Vadodara only." />
      <Reveal className="section-head">
        <span className="eyebrow">Services</span>
        <h1 style={{ fontSize: 'clamp(2.4rem,6vw,4rem)' }}>Nail <span className="italic">services</span></h1>
        <p>Choose a service, then send a booking request. Add-ons such as cat eye and nail art can be mentioned in your message. Sia will confirm the time with you.</p>
        <p className="muted"><strong>{site.serviceAreaNote}</strong></p>
      </Reveal>
      {loading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && data.length === 0 && <p className="center muted">Services will be listed here soon.</p>}
      <div className="grid cols-2">
        {(data || []).map((s, i) => (
          <Reveal key={s.id} delay={i * 0.07}>
            <article className="card service-card" style={{ height: '100%' }}>
              <h3>{s.name}</h3>
              <p className="muted" style={{ flex: 1 }}>{s.description}</p>
              <div className="row">
                <span className="price">{s.price_from != null ? (s.is_addon ? `+ ${fmtPrice(s.price_from)}` : `From ${fmtPrice(s.price_from)}`) : 'Price on request'}</span>
                {s.duration_minutes && <span className="badge">{s.duration_minutes} min</span>}
                <span className="spacer" />
                {!s.is_addon && <Link className="btn btn-primary btn-sm" to={`/book?service=${s.id}`}>Book this</Link>}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
