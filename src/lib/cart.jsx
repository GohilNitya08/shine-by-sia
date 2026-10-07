import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const KEY = 'sbs_cart_v1'
const Ctx = createContext(null)

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
const lineKey = (l) => `${l.productId}|${l.size || ''}`

function reducer(state, a) {
  switch (a.type) {
    case 'add': {
      const i = state.findIndex((l) => lineKey(l) === lineKey(a.line))
      if (i > -1) return state.map((l, j) => (j === i ? { ...l, qty: Math.min(20, l.qty + a.line.qty) } : l))
      return [...state, a.line]
    }
    case 'qty':
      return state.map((l) => (lineKey(l) === a.key ? { ...l, qty: Math.max(1, Math.min(20, a.qty)) } : l))
    case 'remove': return state.filter((l) => lineKey(l) !== a.key)
    case 'sync': {
      // refresh names / prices / availability from the latest product list
      const byId = new Map(a.products.map((p) => [p.id, p]))
      return state
        .filter((l) => byId.has(l.productId))
        .map((l) => {
          const p = byId.get(l.productId)
          return { ...l, name: p.name, price: Number(p.price), image: p.images?.[0] || null, available: p.is_available && p.price != null }
        })
    }
    case 'clear': return []
    default: return state
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)) } catch { /* private mode */ }
  }, [lines])
  const value = useMemo(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0),
    add: (line) => dispatch({ type: 'add', line }),
    setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
    remove: (key) => dispatch({ type: 'remove', key }),
    sync: (products) => dispatch({ type: 'sync', products }),
    clear: () => dispatch({ type: 'clear' }),
    keyOf: lineKey,
  }), [lines])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCart = () => useContext(Ctx)
