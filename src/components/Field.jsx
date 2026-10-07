/** Labelled input with inline error. Defined at module level so inputs keep focus while typing. */
export default function Field({ id, label, req, error, ...input }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}{req && ' *'}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...input} />
      {error && <span className="err" id={`${id}-err`} role="alert">{error}</span>}
    </div>
  )
}
