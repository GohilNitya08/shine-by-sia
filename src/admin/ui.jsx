import { useCallback, useEffect, useState } from 'react'
import { adminList } from '../lib/api'

export function useAdminList(table, order) {
  const [state, set] = useState({ rows: [], loading: true, error: '' })
  const reload = useCallback(async () => {
    try { set({ rows: await adminList(table, order), loading: false, error: '' }) }
    catch (e) { set((s) => ({ ...s, loading: false, error: e.message })) }
  }, [table]) // eslint-disable-line
  useEffect(() => { reload() }, [reload])
  return { ...state, reload, setRows: (rows) => set((s) => ({ ...s, rows })) }
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.9rem', margin: 0 }}>{title}</h2>
          <span className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Confirm({ message, onYes, onNo }) {
  return (
    <Modal title="Are you sure?" onClose={onNo}>
      <p>{message}</p>
      <div className="row"><button className="btn btn-danger" onClick={onYes}>Yes, delete</button><button className="btn btn-ghost" onClick={onNo}>Cancel</button></div>
    </Modal>
  )
}

export const Check = ({ id, label, ...p }) => (
  <label className="check" htmlFor={id}><input id={id} type="checkbox" {...p} />{label}</label>
)

export const Pill = ({ value }) => {
  const tone = { new: 'warn', confirmed: 'ok', paid: 'ok', shipped: 'ok', delivered: 'ok', completed: 'ok', contacted: '', cancelled: 'bad' }[value] ?? ''
  return <span className={`badge ${tone}`}>{value}</span>
}
