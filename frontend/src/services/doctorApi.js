import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const doctorClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const fetchDoctors = async (signal) => {
  const { data } = await doctorClient.get('/api/doctors', { signal })

  if (!Array.isArray(data)) {
    throw new Error('The doctors API returned an invalid response.')
  }

  return data
}

export const fetchFeaturedDoctors = async (signal) => {
  const { data } = await doctorClient.get('/api/doctors/featured', { signal })

  if (!Array.isArray(data)) {
    throw new Error('The featured doctors API returned an invalid response.')
  }

  return data
}

export const fetchDoctorById = async (doctorId, signal) => {
  const { data } = await doctorClient.get(`/api/doctors/${encodeURIComponent(doctorId)}`, {
    signal,
  })
  return data
}

export const createDoctor = async (doctor) => {
  const { data } = await doctorClient.post('/api/doctors', doctor)
  return data
}

export const updateDoctor = async (doctorId, updates) => {
  const { data } = await doctorClient.put(
    `/api/doctors/${encodeURIComponent(doctorId)}`,
    updates,
  )
  return data
}

export const deleteDoctor = async (doctorId) => {
  await doctorClient.delete(`/api/doctors/${encodeURIComponent(doctorId)}`)
}
