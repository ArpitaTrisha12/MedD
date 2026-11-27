import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doctorImages } from '../assets/assets'
import { fetchDoctorById } from '../services/doctorApi'
import {
  createAppointment,
  fetchAppointmentAvailability,
} from '../services/appointmentApi'
import { initiatePayment } from '../services/paymentApi'
import { formatTime12Hour } from '../utils/formatTime'
import './Appointment.css'

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'bKash', logo: '/payment-logos/bkash.svg' },
  { id: 'nagad', name: 'Nagad', logo: '/payment-logos/nagad.svg' },
  { id: 'card', name: 'Credit/Debit Card' },
]

const WEEK_DAYS = [
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' },
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
]

const formatDateInput = (date) => date.toISOString().slice(0, 10)

const addDays = (date, days) => {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [doctorError, setDoctorError] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('bkash')
  const [cardBrand, setCardBrand] = useState('visa')
  const [paymentError, setPaymentError] = useState('')
  const [startingPayment, setStartingPayment] = useState(false)

  const minimumDate = useMemo(
    () => formatDateInput(addDays(new Date(), 7)),
    [],
  )

  useEffect(() => {
    const controller = new AbortController()

    fetchDoctorById(docId, controller.signal)
      .then(setDoctor)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDoctorError(
            error.response?.data?.message ||
            'Unable to load this doctor’s details.',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingDoctor(false)
        }
      })

    return () => controller.abort()
  }, [docId])

  useEffect(() => {
    if (!doctor || !date) {
      return
    }

    const controller = new AbortController()

    fetchAppointmentAvailability(docId, date, controller.signal)
      .then((availability) => {
        setAvailableTimes(availability.availableTimes)
        if (availability.unavailable) {
          setAvailabilityMessage(
            `Temporarily unavailable. ${availability.reason ? `${availability.reason}. ` : ''}${availability.returnDate ? `Expected return: ${availability.returnDate}.` : ''}`,
          )
        } else if (availability.availableTimes.length === 0) {
          setAvailabilityMessage('No appointment slots are currently available on this date.')
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setAvailabilityMessage(
            error.response?.data?.message ||
            'Unable to check availability for this date.',
          )
        }
      })

    return () => controller.abort()
  }, [doctor, docId, date])

  const submitBooking = async (event) => {
    event.preventDefault()
    setFormError('')
    setSuccess(null)

    if (!date || !time) {
      setFormError('Please select an appointment date and time.')
      return
    }

    setSubmitting(true)
    try {
      const appointment = await createAppointment({
        doctorId: docId,
        date,
        time,
      })
      setSuccess(appointment)
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        'Unable to create the appointment. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startPayment = async () => {
    setPaymentError('')
    if (selectedMethod === 'nagad') {
      setPaymentError(
        'Nagad checkout is not available until its official merchant integration is configured.',
      )
      return
    }

    setStartingPayment(true)
    try {
      const checkout = await initiatePayment({
        appointmentId: success._id,
        method: selectedMethod,
        ...(selectedMethod === 'card' ? { cardBrand } : {}),
      })
      window.location.assign(checkout.checkoutUrl)
    } catch (error) {
      setPaymentError(
        error.response?.data?.message ||
        'Unable to start secure checkout. Your appointment remains booked.',
      )
    } finally {
      setStartingPayment(false)
    }
  }

  if (loadingDoctor) {
    return <p className="appointment-status" role="status">Loading doctor details...</p>
  }

  if (doctorError) {
    return <p className="appointment-status appointment-error" role="alert">{doctorError}</p>
  }

  return (
    <div className="appointment-page">
      <div className="appointment-layout">
        <section className="appointment-doctor-card">
          <div className="appointment-doctor-image">
            <img
              src={doctorImages[doctor.image] || doctor.image}
              alt={doctor.name}
            />
          </div>
          <div className="appointment-doctor-info">
            <p className="appointment-speciality">{doctor.speciality}</p>
            <h1>{doctor.name}</h1>
            <p>{doctor.degree} • {doctor.experience}</p>
            <p>{doctor.division} Division</p>
            {doctor.address && (
              <p>{doctor.address.line1}, {doctor.address.line2}</p>
            )}
            <div className="appointment-visiting-section">
              <p className="appointment-visiting-label">Visiting days</p>
              <div className="appointment-day-card-grid" aria-label="Doctor visiting days">
                {WEEK_DAYS.map(({ day, name }) => (
                  <div
                    key={day}
                    className={`appointment-day-card ${(doctor.visitingDays || []).includes(day) ? 'active' : ''}`}
                    aria-label={`${name}${(doctor.visitingDays || []).includes(day) ? ', visiting day' : ', unavailable day'}`}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
            <div className="appointment-fee">
              <span>Consultation fee</span>
              <strong>৳1,000</strong>
            </div>
            <p className="appointment-discount">
              Returning patient within 3 months: <strong>৳700</strong>
            </p>
          </div>
        </section>

        <section className="appointment-booking-card">
          <div className="appointment-booking-heading">
            <span>ONLINE BOOKING</span>
            <h2>Book an Appointment</h2>
          </div>

          {success ? (
            <div className="appointment-success" role="status">
              <div className="appointment-payment-confirmation">
                <span>BOOKING CONFIRMED</span>
                <h3>Appointment booked</h3>
                <p>{success.appointmentDate} at {formatTime12Hour(success.appointmentTime)}</p>
              </div>

              <section className="payment-selection" aria-labelledby="payment-selection-title">
                <div className="payment-selection-heading">
                  <div>
                    <span>SECURE CHECKOUT</span>
                    <h3 id="payment-selection-title">Choose a payment method</h3>
                  </div>
                  <span className="payment-pending-pill">Payment not started</span>
                </div>

                <div className="payment-method-grid">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      className={`payment-method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                      aria-pressed={selectedMethod === method.id}
                      onClick={() => {
                        setSelectedMethod(method.id)
                        setPaymentError('')
                      }}
                    >
                      {method.logo ? (
                        <img src={method.logo} alt={`${method.name} logo`} />
                      ) : (
                        <div className="payment-card-logos" aria-label="Visa and Mastercard">
                          <img src="/payment-logos/visa.svg" alt="Visa logo" />
                          <img src="/payment-logos/mastercard.svg" alt="Mastercard logo" />
                        </div>
                      )}
                      <span className="payment-method-name">{method.name}</span>
                      <span className="payment-method-radio" aria-hidden="true">
                        {selectedMethod === method.id ? '✓' : ''}
                      </span>
                      {method.id === 'nagad' && (
                        <span className="payment-method-note">Setup pending</span>
                      )}
                    </button>
                  ))}
                </div>

                {selectedMethod === 'card' && (
                  <fieldset className="payment-card-brand">
                    <legend>Choose card network</legend>
                    {[
                      { value: 'visa', label: 'Visa', logo: '/payment-logos/visa.svg' },
                      { value: 'mastercard', label: 'Mastercard', logo: '/payment-logos/mastercard.svg' },
                    ].map((brand) => (
                      <label key={brand.value} className={cardBrand === brand.value ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="card-brand"
                          value={brand.value}
                          checked={cardBrand === brand.value}
                          onChange={() => setCardBrand(brand.value)}
                        />
                        <img src={brand.logo} alt="" />
                        <span>{brand.label}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                <div className="payment-summary">
                  <div><span>Consultation fee</span><strong>৳1,000</strong></div>
                  {success.discountApplied && (
                    <div className="payment-discount-line">
                      <span>Returning-patient discount</span><strong>−৳300</strong>
                    </div>
                  )}
                  <div className="payment-total">
                    <span>Amount due</span><strong>৳{success.fee}</strong>
                  </div>
                </div>

                {paymentError && (
                  <p className="payment-init-error" role="alert">{paymentError}</p>
                )}
                <p className="payment-security-note">
                  Card details are entered only on the payment provider’s secure checkout.
                  MedD does not store card numbers or CVV.
                </p>
                <button
                  type="button"
                  className="appointment-submit payment-continue"
                  onClick={startPayment}
                  disabled={startingPayment || selectedMethod === 'nagad'}
                >
                  {startingPayment ? 'Connecting to provider...' : 'Continue to secure payment'}
                </button>
              </section>

              <button
                type="button"
                className="appointment-view-bookings"
                onClick={() => navigate('/my-appointments')}
              >
                View My Appointments
              </button>
            </div>
          ) : (
            <form onSubmit={submitBooking}>
              <label htmlFor="appointment-date">Appointment date</label>
              <input
                id="appointment-date"
                type="date"
                min={minimumDate}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value)
                  setAvailableTimes([])
                  setTime('')
                  setAvailabilityMessage('')
                  setFormError('')
                }}
                required
              />
              <p className="appointment-rule">
                Bookings must be at least 7 days ahead.
              </p>

              {availabilityMessage && (
                <p className="appointment-availability" role="status">
                  {availabilityMessage}
                </p>
              )}

              {availableTimes.length > 0 && (
                <>
                  <label>Available time</label>
                  <div className="appointment-time-grid">
                    {availableTimes.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        className={time === slot ? 'selected' : ''}
                        onClick={() => setTime(slot)}
                      >
                        {formatTime12Hour(slot)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {formError && (
                <p className="appointment-form-error" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="appointment-submit"
                disabled={submitting || !date || !time}
              >
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

export default Appointment
