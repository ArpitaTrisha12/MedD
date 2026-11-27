import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const paymentClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const initiatePayment = async ({ appointmentId, method, cardBrand }) => {
  const { data } = await paymentClient.post('/api/payments/checkout', {
    appointmentId,
    method,
    ...(cardBrand ? { cardBrand } : {}),
  })
  return data
}

export const fetchMyPayments = async (signal) => {
  const { data } = await paymentClient.get('/api/payments/mine', { signal })
  return data
}

export const fetchPayment = async (paymentId, signal) => {
  const { data } = await paymentClient.get(
    `/api/payments/${encodeURIComponent(paymentId)}`,
    { signal },
  )
  return data
}
