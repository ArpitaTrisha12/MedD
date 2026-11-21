import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const prescriptionClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const createPrescription = async (prescription) => {
  const { data } = await prescriptionClient.post('/api/prescriptions', prescription)
  return data
}

export const fetchMyPrescriptions = async (signal) => {
  const { data } = await prescriptionClient.get('/api/prescriptions/mine', { signal })
  return data
}

export const fetchDoctorPrescriptions = async (signal) => {
  const { data } = await prescriptionClient.get('/api/prescriptions/doctor', { signal })
  return data
}

export const downloadPrescriptionPdf = async (prescriptionId) => {
  const response = await prescriptionClient.get(
    `/api/prescriptions/${encodeURIComponent(prescriptionId)}/pdf`,
    { responseType: 'blob' },
  )
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `prescription-${prescriptionId}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
