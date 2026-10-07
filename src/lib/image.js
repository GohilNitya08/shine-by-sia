/** Resize + convert an uploaded image to WebP in the browser (fast pages, small storage). */
export async function compressImage(file, maxSide = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))
  if (!blob) throw new Error('Could not process this image.')
  return blob
}
