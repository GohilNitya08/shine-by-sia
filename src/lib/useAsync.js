import { useEffect, useState } from 'react'

export function useAsync(fn, deps = []) {
  const [state, set] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let alive = true
    set((s) => ({ ...s, loading: true, error: null }))
    fn().then(
      (data) => alive && set({ data, error: null, loading: false }),
      (error) => alive && set({ data: null, error, loading: false })
    )
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
