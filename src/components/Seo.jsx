import { useEffect } from 'react'
import { site } from '../config/site'

export default function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : `${site.name} · Nails & Press-On Nails`
    if (description) {
      let el = document.querySelector('meta[name="description"]')
      if (el) el.setAttribute('content', description)
    }
  }, [title, description])
  return null
}
