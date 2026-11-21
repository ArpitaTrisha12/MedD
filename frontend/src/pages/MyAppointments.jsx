import { useEffect, useState } from 'react'
import { doctorImages } from '../assets/assets'
import {
  cancelAppointment,
  fetchAppointmentAvailability,
  fetchMyAppointments,
  rescheduleAppointment,
} from '../services/appointmentApi'
import './MyAppointments.css'

const statusClass = (status) => status.toLowerCase()

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reschedulingId, setReschedulingId] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    fetchMyAppointments(controller.signal)
      .then(setAppointments)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(
            requestError.response?.data?.message ||
            'Unable to load your appointments.',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Cancel this appointment?')) return
    setActionError('')
    try {
      await cancelAppointment(appointmentId)
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, status: 'Cancelled' }
            : appointment,
        ),
      )
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to cancel appointment.')
    }
  }

  const startReschedule = (appointment) => {
    setReschedulingId(appointment._id)
    setRescheduleDate('')
    setRescheduleTime('')
    setAvailableTimes([])
    setActionError('')
  }

  const loadRescheduleTimes = async (appointment, date) => {
    setRescheduleDate(date)
    setRescheduleTime('')
    setAvailableTimes([])
    if (!date) return
    try {
      const availability = await fetchAppointmentAvailability(
        appointment.doctor._id,
        date,
      )
      setAvailableTimes(availability.availableTimes)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to load available times.')
    }
  }

  const handleReschedule = async (appointment) => {
    if (!rescheduleDate || !rescheduleTime) {
      setActionError('Please select a new date and time.')
      return
    }
    setActionError('')
    try {
      const updated = await rescheduleAppointment(
        appointment._id,
        rescheduleDate,
        rescheduleTime,
      )
      setAppointments((current) =>
        current.map((item) =>
          item._id === appointment._id ? { ...item, ...updated } : item,
        ),
      )
      setReschedulingId('')
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to reschedule appointment.')
    }
  }

  return (
    <div className="my-appointments-page">
      <div className="my-appointments-heading">
        <h1>My Appointments</h1>
        <p>View your upcoming and previous MedD bookings.</p>
      </div>

      {loading && (
        <p className="my-appointments-status" role="status">
          Loading appointments...
        </p>
      )}

      {error && (
        <p className="my-appointments-status my-appointments-error" role="alert">
          {error}
        </p>
      )}
      {actionError && (
        <p className="my-appointments-status my-appointments-error" role="alert">
          {actionError}
        </p>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="my-appointments-empty">
          <h2>No appointments yet</h2>
          <p>You have not booked any appointments.</p>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="my-appointments-list">
          {appointments.map((appointment) => (
            <article className="my-appointment-card" key={appointment._id}>
              {appointment.doctor && (
                <div className="my-appointment-doctor">
                  <img
                    src={
                      doctorImages[appointment.doctor.image] ||
                      appointment.doctor.image
                    }
                    alt={appointment.doctor.name}
                  />
                  <div>
                    <h2>{appointment.doctor.name}</h2>
                    <p>
                      {appointment.doctor.speciality}
                      {appointment.doctor.division
                        ? ` • ${appointment.doctor.division}`
                        : ''}
                    </p>
                  </div>
                </div>
              )}

              <div className="my-appointment-details">
                <div>
                  <span>Date</span>
                  <strong>{appointment.appointmentDate}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{appointment.appointmentTime}</strong>
                </div>
                <div>
                  <span>Fee</span>
                  <strong>
                    ৳{appointment.fee}
                    {appointment.discountApplied ? ' (Discounted)' : ''}
                  </strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong className={`appointment-status-badge ${statusClass(appointment.status)}`}>
                    {appointment.status}
                  </strong>
                </div>
              </div>
              {appointment.status !== 'Cancelled' && appointment.status !== 'Completed' && (
                <div className="my-appointment-actions">
                  <button type="button" onClick={() => startReschedule(appointment)}>Reschedule</button>
                  <button type="button" className="cancel-action" onClick={() => handleCancel(appointment._id)}>Cancel</button>
                </div>
              )}
              {reschedulingId === appointment._id && (
                <div className="reschedule-panel">
                  <label>
                    New date
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(event) => loadRescheduleTimes(appointment, event.target.value)}
                    />
                  </label>
                  {availableTimes.length > 0 && (
                    <div className="reschedule-times">
                      {availableTimes.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          className={rescheduleTime === slot ? 'selected' : ''}
                          onClick={() => setRescheduleTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => handleReschedule(appointment)}>Confirm Reschedule</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAppointments
