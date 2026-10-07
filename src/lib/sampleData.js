/**
 * DEMO CONTENT shown only when Supabase is not connected yet.
 * Services use the confirmed base menu; press-on sets are sample items with no price.
 * Once Supabase is connected, the site shows only what is in the database.
 */
export const sampleServices = [
  { id: 's1', name: 'Gel Polish', description: 'Gel polish application.', price_from: 199, duration_minutes: null, image_url: null, is_addon: false, is_active: true, sort_order: 1 },
  { id: 's2', name: 'Gel Polish + Extension', description: 'Gel polish with nail extensions.', price_from: 299, duration_minutes: null, image_url: null, is_addon: false, is_active: true, sort_order: 2 },
  { id: 's3', name: 'Soft Gel Extension', description: 'Soft gel nail extensions.', price_from: 499, duration_minutes: null, image_url: null, is_addon: false, is_active: true, sort_order: 3 },
  { id: 's4', name: 'Acrylic Extension', description: 'Acrylic nail extensions.', price_from: 699, duration_minutes: null, image_url: null, is_addon: false, is_active: true, sort_order: 4 },
  { id: 's5', name: 'Gel Polish Removal', description: 'Safe removal of gel polish.', price_from: 99, duration_minutes: null, image_url: null, is_addon: false, is_active: true, sort_order: 5 },
  { id: 's6', name: 'Extension Removal', description: 'Safe removal of nail extensions.', price_from: 149, duration_minutes: null, image_url: null, is_addon: false, is_active: true, sort_order: 6 },
  { id: 's7', name: 'Cat Eye', description: 'Cat eye effect, added to any service.', price_from: 50, duration_minutes: null, image_url: null, is_addon: true, is_active: true, sort_order: 7 },
  { id: 's8', name: 'Nail Art', description: 'Nail art, added to any service.', price_from: 10, duration_minutes: null, image_url: null, is_addon: true, is_active: true, sort_order: 8 },
]

const mk = (i, name, price, extra = {}) => ({
  id: `p${i}`, slug: `sample-set-${i}`, name, description: 'Sample product. Replace the name, photos, price and description in the admin dashboard.',
  price, compare_at_price: null, images: [], size_options: ['XS', 'S', 'M', 'L'], category: 'Press-ons',
  is_available: true, is_published: true, is_featured: i <= 4, sort_order: i, ...extra,
})

export const sampleProducts = [
  mk(1, 'Sample Press-On Set 1', null),
  mk(2, 'Sample Press-On Set 2', null),
  mk(3, 'Sample Press-On Set 3', null),
  mk(4, 'Sample Press-On Set 4', null),
  mk(5, 'Sample Press-On Set 5', null),
  mk(6, 'Sample Press-On Set 6 (sold out)', null, { is_available: false }),
]

export const sampleGallery = Array.from({ length: 9 }, (_, i) => ({
  id: `g${i + 1}`, image_url: null, caption: `Placeholder ${i + 1}`, is_visible: true, sort_order: i + 1,
}))
