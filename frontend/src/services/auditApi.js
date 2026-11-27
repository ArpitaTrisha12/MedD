import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const auditClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const fetchAuditHistory = async (params, signal) => {
  const { data } = await auditClient.get('/api/audit-logs', { params, signal })
  return data
}
