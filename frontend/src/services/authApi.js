import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const registerPatient = async (account) => {
  const { data } = await authClient.post('/api/auth/register', account)
  return data.user
}

export const loginUser = async (credentials) => {
  const role = credentials.role
  const endpoint = role === 'Patient'
    ? '/api/auth/patient/login'
    : role === 'Doctor'
      ? '/api/auth/doctor/login'
      : '/api/auth/admin/login'
  const { data } = await authClient.post(endpoint, credentials)
  return data.user
}

export const getCurrentUser = async () => {
  const { data } = await authClient.get('/api/auth/me')
  return data.user
}

export const logoutUser = async () => {
  await authClient.post('/api/auth/logout')
}

export const fetchProfile = async () => {
  const { data } = await authClient.get('/api/auth/profile')
  return data.user
}

export const updateProfile = async (profile) => {
  const { data } = await authClient.put('/api/auth/profile', profile)
  return data.user
}
