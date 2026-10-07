export const Loading = ({ rows = 3 }) => (
  <div className="grid cols-3" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
  </div>
)
export const ErrorBox = ({ error }) => <div className="alert err" role="alert">{error?.message || 'Something went wrong.'}</div>
