import { useEffect, useState } from 'react'
import { doctorImages } from '../assets/assets'
import { fetchMyAppointments } from '../services/appointmentApi'
import './MyAppointments.css'

const statusClass = (status) => status.toLowerCase()

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAppointments
