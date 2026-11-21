import Appointment from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'

export const APPOINTMENT_TIMES = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

const STANDARD_FEE = 1000
const RETURNING_PATIENT_FEE = 700
const ADVANCE_DAYS = 7

const parseDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDate = (date) => date.toISOString().slice(0, 10)

export const addUtcDays = (date, days) => {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

const earliestBookingDate = () => formatDate(addUtcDays(new Date(), ADVANCE_DAYS))

const timeToMinutes = (time) => {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null
  }

  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + minutes
}

const minutesToTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const generateVisitingTimes = (startTime, endTime) => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return []
  }

  const times = []
  for (
    let minutes = startMinutes;
    minutes + 60 <= endMinutes;
    minutes += 60
  ) {
    times.push(minutesToTime(minutes))
  }

  return times
}

export const getVisitingTimesForDay = (doctor, day) => {
  const configuredHours = Array.isArray(doctor.visitingHours)
    ? doctor.visitingHours.filter((hours) => hours.day === day)
    : []

  if (configuredHours.length > 0) {
    const times = new Set()
    configuredHours.forEach((hours) => {
      generateVisitingTimes(hours.startTime, hours.endTime)
        .forEach((time) => times.add(time))
    })
    return [...times].sort()
  }

  if (Array.isArray(doctor.visitingDays) && doctor.visitingDays.includes(day)) {
    return APPOINTMENT_TIMES
  }

  return []
}

const inTemporaryUnavailability = (doctor, date) => {
  const unavailable = doctor.temporaryUnavailability

  if (
    !unavailable?.startDate ||
    !unavailable?.endDate ||
    date < unavailable.startDate ||
    date > unavailable.endDate
  ) {
    return null
  }

  return unavailable
}

export const calculateFee = async (patientId, doctorId, appointmentDate, excludeAppointmentId = null) => {
  const bookingDate = parseDate(appointmentDate)
  if (!bookingDate) {
    return { fee: STANDARD_FEE, discountApplied: false }
  }

  const cutoff = new Date(bookingDate)
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 3)

  const priorFilter = {
    patient: patientId,
    doctor: doctorId,
    appointmentDate: {
      $gte: formatDate(cutoff),
      $lt: appointmentDate,
    },
    status: { $ne: 'Cancelled' },
  }
  if (excludeAppointmentId) {
    priorFilter._id = { $ne: excludeAppointmentId }
  }

  const priorAppointment = await Appointment.findOne(priorFilter).lean()

  if (priorAppointment) {
    return { fee: RETURNING_PATIENT_FEE, discountApplied: true }
  }

  return { fee: STANDARD_FEE, discountApplied: false }
}

export const getAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params
    const date = req.query.date
    const doctor = await Doctor.findById(doctorId).lean()

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    const parsedDate = parseDate(date)
    if (!parsedDate) {
      return res.status(400).json({ message: 'Provide a valid appointment date.' })
    }

    if (formatDate(parsedDate) < earliestBookingDate()) {
      return res.status(400).json({
        message: 'Appointments must be booked at least 7 days ahead.',
      })
    }

    const unavailable = inTemporaryUnavailability(doctor, formatDate(parsedDate))
    const visitingDay = parsedDate.getUTCDay()
    const visitingTimes = getVisitingTimesForDay(doctor, visitingDay)
    if (visitingTimes.length === 0 || unavailable) {
      return res.json({
        availableTimes: [],
        unavailable: Boolean(unavailable),
        returnDate: unavailable?.returnDate || '',
        reason: unavailable?.reason || '',
      })
    }

    const bookings = await Appointment.find({
      doctor: doctorId,
      appointmentDate: formatDate(parsedDate),
      status: { $ne: 'Cancelled' },
    }).select('appointmentTime').lean()

    const bookedTimes = new Set(bookings.map((booking) => booking.appointmentTime))

    res.json({
      availableTimes: visitingTimes.filter((time) => !bookedTimes.has(time)),
      unavailable: false,
      returnDate: '',
      reason: '',
    })
  } catch (error) {
    next(error)
  }
}

export const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, time } = req.body ?? {}
    const parsedDate = parseDate(date)

    if (!parsedDate) {
      return res.status(400).json({ message: 'Provide a valid appointment date.' })
    }

    const doctor = await Doctor.findById(doctorId).lean()
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    const validTimes = getVisitingTimesForDay(doctor, parsedDate.getUTCDay())
    if (!validTimes.includes(time)) {
      return res.status(400).json({ message: 'Select a valid appointment time.' })
    }

    if (formatDate(parsedDate) < earliestBookingDate()) {
      return res.status(400).json({
        message: 'Appointments must be booked at least 7 days ahead.',
      })
    }

    const normalizedDate = formatDate(parsedDate)
    const unavailable = inTemporaryUnavailability(doctor, normalizedDate)
    if (unavailable) {
      return res.status(409).json({
        message: 'The doctor is temporarily unavailable on this date.',
        returnDate: unavailable.returnDate,
      })
    }

    if (!Array.isArray(doctor.visitingDays) || !doctor.visitingDays.includes(parsedDate.getUTCDay())) {
      return res.status(400).json({
        message: 'This date is outside the doctor’s weekly visiting days.',
      })
    }

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: normalizedDate,
      appointmentTime: time,
      status: { $ne: 'Cancelled' },
    }).lean()

    if (conflict) {
      return res.status(409).json({
        message: 'This appointment slot was just booked. Please choose another time.',
      })
    }

    const feeDetails = await calculateFee(req.user._id, doctorId, normalizedDate)

    try {
      const appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctorId,
        appointmentDate: normalizedDate,
        appointmentTime: time,
        fee: feeDetails.fee,
        discountApplied: feeDetails.discountApplied,
        status: 'Pending',
      })

      res.status(201).json({ appointment })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: 'This appointment slot was just booked. Please choose another time.',
        })
      }
      throw error
    }
  } catch (error) {
    next(error)
  }
}

export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .lean()

    const doctorIds = [...new Set(appointments.map((appointment) => appointment.doctor))]
    const doctors = await Doctor.find({ _id: { $in: doctorIds } }).lean()
    const doctorById = new Map(doctors.map((doctor) => [doctor._id, doctor]))

    res.json(
      appointments.map((appointment) => {
        const doctor = doctorById.get(appointment.doctor)

        return {
          ...appointment,
          doctor: doctor
            ? {
              _id: doctor._id,
              name: doctor.name,
              image: doctor.image,
              speciality: doctor.speciality,
              division: doctor.division,
            }
            : null,
        }
      }),
    )
  } catch (error) {
    next(error)
  }
}

export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' })
    }
    if (appointment.status === 'Cancelled') {
      return res.status(409).json({ message: 'This appointment is already cancelled.' })
    }
    if (appointment.status === 'Completed') {
      return res.status(409).json({ message: 'A completed appointment cannot be cancelled.' })
    }

    appointment.status = 'Cancelled'
    await appointment.save()
    res.json({ appointment })
  } catch (error) {
    next(error)
  }
}

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' })
    }
    if (appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      return res.status(409).json({
        message: 'Cancelled or completed appointments cannot be rescheduled.',
      })
    }

    const { date, time } = req.body ?? {}
    const parsedDate = parseDate(date)
    if (!parsedDate) {
      return res.status(400).json({ message: 'Provide a valid appointment date.' })
    }
    if (formatDate(parsedDate) < earliestBookingDate()) {
      return res.status(400).json({
        message: 'Appointments must be booked at least 7 days ahead.',
      })
    }

    const doctor = await Doctor.findById(appointment.doctor).lean()
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    const validTimes = getVisitingTimesForDay(doctor, parsedDate.getUTCDay())
    if (!validTimes.includes(time)) {
      return res.status(400).json({ message: 'Select a valid appointment time.' })
    }

    const normalizedDate = formatDate(parsedDate)
    if (inTemporaryUnavailability(doctor, normalizedDate)) {
      return res.status(409).json({
        message: 'The doctor is temporarily unavailable on this date.',
      })
    }

    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      appointmentDate: normalizedDate,
      appointmentTime: time,
      status: { $ne: 'Cancelled' },
    }).lean()
    if (conflict) {
      return res.status(409).json({
        message: 'This appointment slot is already booked.',
      })
    }

    const feeDetails = await calculateFee(
      req.user._id,
      appointment.doctor,
      normalizedDate,
      appointment._id,
    )

    appointment.appointmentDate = normalizedDate
    appointment.appointmentTime = time
    appointment.fee = feeDetails.fee
    appointment.discountApplied = feeDetails.discountApplied
    await appointment.save()

    res.json({ appointment })
  } catch (error) {
    next(error)
  }
}
