import { useEffect } from 'react'

export default function Toast({ message, onDone, ms = 2600 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, ms)
    return () => clearTimeout(t)
  }, [message, onDone, ms])
  if (!message) return null
  return <div className="toast" role="status">{message}</div>
}
