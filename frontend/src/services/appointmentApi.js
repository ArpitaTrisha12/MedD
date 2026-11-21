import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const appointmentClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const fetchAppointmentAvailability = async (doctorId, date, signal) => {
  const { data } = await appointmentClient.get(
    `/api/appointments/availability/${encodeURIComponent(doctorId)}`,
    { params: { date }, signal },
  )
  return data
}

export const createAppointment = async ({ doctorId, date, time }) => {
  const { data } = await appointmentClient.post('/api/appointments', {
    doctorId,
    date,
    time,
  })
  return data.appointment
}

export const fetchMyAppointments = async (signal) => {
  const { data } = await appointmentClient.get('/api/appointments/mine', { signal })
  return data
}
