/**
 * ONE FILE TO CUSTOMISE THE WHOLE SITE.
 * Everything marked TODO is a placeholder - replace it with real details.
 * Colours live in src/styles/theme.css (CSS variables at the top).
 */
export const site = {
  name: 'Shine by Sia',
  shortName: 'Shine',
  tagline: 'Nail services, custom nail orders & press-on nails',
  // TODO: replace with Sia's own words
  intro: 'Nail services, customized nail orders and press-on nails, available in Vadodara only.',
  city: 'Vadodara, Gujarat',
  // Everything is Vadodara-only (confirmed).
  serviceAreaNote: 'Nail services, customized orders and press-on nails are available in Vadodara only.',

  instagramHandle: 'shine_by_sia',
  instagramUrl: 'https://www.instagram.com/shine_by_sia',

  // TODO: real WhatsApp number, digits only with country code, e.g. 919876543210
  whatsappNumber: '',
  // TODO: optional public email
  email: '',

  currency: { code: 'INR', symbol: '₹', locale: 'en-IN' },

  // Shown at checkout. TODO: edit to match how Sia actually takes payment.
  checkoutNote:
    'Place your order and Sia will confirm payment and delivery details with you on WhatsApp.',
  shippingNote: 'Press-on nails are available in Vadodara only and are not shipped outside Vadodara. Delivery or pickup details are confirmed on WhatsApp after you order.',

  // Hero / about images. Leave '' to use the built-in placeholder artwork,
  // or put a file in /public and use e.g. '/images/hero.jpg'
  images: { hero: '', about: '' },

  about: {
    title: 'Meet Sia',
    // TODO: replace with her real story
    body: 'This section is a placeholder. Replace it with a short note about Sia, how she started and what she loves making.',
  },

  // Set true to show the "placeholder content" ribbon site-wide until real content is in.
  showPlaceholderBadge: true,
}

export const fmtPrice = (n) =>
  new Intl.NumberFormat(site.currency.locale, {
    style: 'currency',
    currency: site.currency.code,
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)

export const waLink = (text = '') => {
  const base = site.whatsappNumber
    ? `https://wa.me/${site.whatsappNumber}`
    : 'https://wa.me/'
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
