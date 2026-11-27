import { useEffect, useState } from 'react'
import { fetchAuditHistory } from '../services/auditApi'
import './AuditHistory.css'

const emptyFilters = {
  from: '',
  to: '',
  userRole: '',
  operationType: '',
  module: '',
}

const PAGE_SIZE = 50

const AuditHistory = () => {
  const [filters, setFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({
    requestKey: '',
    history: { items: [], total: 0, pages: 0 },
    error: '',
  })
  const params = {
    page,
    limit: PAGE_SIZE,
    ...Object.fromEntries(
      Object.entries(appliedFilters).filter(([, value]) => value),
    ),
  }
  const requestKey = JSON.stringify(params)

  useEffect(() => {
    const controller = new AbortController()
    fetchAuditHistory(JSON.parse(requestKey), controller.signal)
      .then((history) => setResult({ requestKey, history, error: '' }))
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setResult({
            requestKey,
            history: { items: [], total: 0, pages: 0 },
            error: requestError.response?.data?.message || 'Unable to load audit history.',
          })
        }
      })

    return () => controller.abort()
  }, [requestKey])

  const loading = result.requestKey !== requestKey
  const history = loading ? { items: [], total: 0, pages: 0 } : result.history
  const error = loading ? '' : result.error

  const applyFilters = (event) => {
    event.preventDefault()
    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(1)
  }

  return (
    <main className="audit-history-page">
      <header className="audit-history-heading">
        <h1>Database Activity History</h1>
        <p>Append-only record of database changes made from this point forward.</p>
      </header>

      <form className="audit-filter-form" onSubmit={applyFilters}>
        <label>
          From
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          />
        </label>
        <label>
          User role
          <select
            value={filters.userRole}
            onChange={(event) => setFilters((current) => ({ ...current, userRole: event.target.value }))}
          >
            <option value="">All roles</option>
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Admin">Admin</option>
          </select>
        </label>
        <label>
          Action type
          <select
            value={filters.operationType}
            onChange={(event) => setFilters((current) => ({ ...current, operationType: event.target.value }))}
          >
            <option value="">All actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>
        <label>
          Module
          <select
            value={filters.module}
            onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value }))}
          >
            <option value="">All modules</option>
            <option value="patients">Patients</option>
            <option value="doctorAccounts">Doctor accounts</option>
            <option value="admins">Admins</option>
            <option value="doctors">Doctors</option>
            <option value="appointments">Appointments</option>
            <option value="reviews">Reviews</option>
            <option value="prescriptions">Prescriptions</option>
            <option value="healthReports">Health reports</option>
          </select>
        </label>
        <div className="audit-filter-actions">
          <button type="submit">Apply filters</button>
          <button type="button" className="audit-reset-button" onClick={resetFilters}>Reset</button>
        </div>
      </form>

      {error && <p className="audit-error" role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading activity history...</p>
      ) : (
        <>
          <p className="audit-result-count">{history.total} activity record(s)</p>
          {history.items.length === 0 ? (
            <p className="audit-empty">No activity records match these filters.</p>
          ) : (
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>User role</th>
                    <th>Action type</th>
                    <th>Module</th>
                    <th>User ID</th>
                    <th>Related record</th>
                    <th>Date and time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.items.map((entry) => (
                    <tr key={entry._id}>
                      <td>{entry.action}</td>
                      <td>{entry.userRole}</td>
                      <td><span className={`audit-operation audit-operation-${entry.operationType.toLowerCase()}`}>{entry.operationType}</span></td>
                      <td>{entry.module}</td>
                      <td><code>{entry.userId}</code></td>
                      <td><code>{entry.relatedRecordId}</code></td>
                      <td>
                        <time dateTime={entry.createdAt}>
                          {new Date(entry.createdAt).toLocaleString()}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {history.pages > 1 && (
            <nav className="audit-pagination" aria-label="Audit history pages">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </button>
              <span>Page {page} of {history.pages}</span>
              <button type="button" disabled={page >= history.pages} onClick={() => setPage((current) => current + 1)}>
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

export default AuditHistory
