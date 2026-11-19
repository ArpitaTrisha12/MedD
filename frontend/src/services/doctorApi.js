import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

export const fetchDoctors = async (signal) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/doctors`, { signal })

  if (!Array.isArray(data)) {
    throw new Error('The doctors API returned an invalid response.')
  }

  return data
}
