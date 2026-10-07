import { useId } from 'react'

const PALETTES = [
  ['#f6cfc9', '#e9a79f'], ['#f2dcc9', '#d9b08a'], ['#ead3e6', '#c79bc0'],
  ['#fbe7e1', '#efbdb4'], ['#e7d9cf', '#c3a28c'], ['#f4d3d9', '#d98c9d'],
]
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Soft illustrated placeholder shown wherever a real photo has not been uploaded yet. */
export default function NailArt({ seed = 'a', ratio = 'portrait', label = 'Placeholder' }) {
  const id = useId().replace(/:/g, '')
  const h = hash(seed)
  const [c1, c2] = PALETTES[h % PALETTES.length]
  const [d1, d2] = PALETTES[(h >> 3) % PALETTES.length]
  const w = 400, hgt = ratio === 'square' ? 400 : ratio === 'wide' ? 280 : 500
  const nails = [0, 1, 2, 3, 4].map((i) => ({
    x: 52 + i * 66, y: hgt / 2 - 40 + [26, 0, -14, 4, 40][i], h: [118, 138, 150, 138, 100][i], w: 52,
  }))
  return (
    <svg viewBox={`0 0 ${w} ${hgt}`} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbeee9" /><stop offset="1" stopColor="#f3dfd6" />
        </linearGradient>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={d1} /><stop offset="1" stopColor={d2} /></linearGradient>
      </defs>
      <rect width={w} height={hgt} fill={`url(#bg${id})`} />
      <circle cx={w - 70} cy={70} r={46} fill="#fff" opacity=".35" />
      {nails.map((n, i) => (
        <g key={i}>
          <path d={`M${n.x} ${n.y + n.h} V${n.y + 26} Q${n.x} ${n.y} ${n.x + n.w / 2} ${n.y} Q${n.x + n.w} ${n.y} ${n.x + n.w} ${n.y + 26} V${n.y + n.h} Q${n.x + n.w / 2} ${n.y + n.h + 12} ${n.x} ${n.y + n.h}Z`}
            fill={`url(#${i % 2 ? 'b' : 'a'}${id})`} />
          <path d={`M${n.x + 10} ${n.y + 26} Q${n.x + 12} ${n.y + 8} ${n.x + 26} ${n.y + 7}`} stroke="#fff" strokeOpacity=".7" strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      ))}
    </svg>
  )
}
