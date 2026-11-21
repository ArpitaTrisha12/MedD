import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const accountClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const fetchDoctorAccounts = async () => {
  const { data } = await accountClient.get('/api/accounts/doctoraccounts')
  return data
}

export const createDoctorAccount = async (account) => {
  const { data } = await accountClient.post('/api/accounts/doctoraccounts', account)
  return data
}

export const updateDoctorAccount = async (accountId, updates) => {
  const { data } = await accountClient.put(
    `/api/accounts/doctoraccounts/${encodeURIComponent(accountId)}`,
    updates,
  )
  return data
}

export const deleteDoctorAccount = async (accountId) => {
  await accountClient.delete(
    `/api/accounts/doctoraccounts/${encodeURIComponent(accountId)}`,
  )
}
