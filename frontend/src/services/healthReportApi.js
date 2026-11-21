import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const reportClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const uploadHealthReport = async (formData) => {
  const { data } = await reportClient.post('/api/health-reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const fetchMyHealthReports = async (signal) => {
  const { data } = await reportClient.get('/api/health-reports/mine', { signal })
  return data
}

export const fetchDoctorPatientReports = async (patientId, signal) => {
  const { data } = await reportClient.get(
    `/api/health-reports/patient/${encodeURIComponent(patientId)}`,
    { signal },
  )
  return data
}

export const downloadHealthReport = async (reportId, originalName) => {
  const response = await reportClient.get(
    `/api/health-reports/${encodeURIComponent(reportId)}/download`,
    { responseType: 'blob' },
  )
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = originalName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
