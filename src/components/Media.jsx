import NailArt from './NailArt'
import { site } from '../config/site'

/** A real photo if one exists, otherwise the soft placeholder illustration. */
export default function Media({ src, seed, alt = '', ratio, eager = false, tag = true }) {
  if (src) {
    return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
  }
  return (
    <>
      <NailArt seed={seed || alt} ratio={ratio} label={alt || 'Placeholder image'} />
      {tag && site.showPlaceholderBadge && <span className="ph-tag">placeholder</span>}
    </>
  )
}
