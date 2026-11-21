import assert from 'node:assert/strict'
import test from 'node:test'
import Appointment from '../models/Appointment.js'
import {
  APPOINTMENT_TIMES,
  addUtcDays,
  calculateFee,
  formatDate,
  generateVisitingTimes,
  getVisitingTimesForDay,
} from '../controllers/appointmentController.js'

test('visiting hours generate hourly slots inside the configured range', () => {
  assert.deepEqual(
    generateVisitingTimes('09:30', '13:30'),
    ['09:30', '10:30', '11:30', '12:30'],
  )
  assert.deepEqual(generateVisitingTimes('18:00', '09:00'), [])
})

test('visiting times match the configured day and preserve legacy fallback', () => {
  const doctor = {
    visitingDays: [1, 3],
    visitingHours: [
      { day: 1, startTime: '09:00', endTime: '12:00' },
      { day: 3, startTime: '14:00', endTime: '17:00' },
    ],
  }

  assert.deepEqual(
    getVisitingTimesForDay(doctor, 1),
    ['09:00', '10:00', '11:00'],
  )
  assert.deepEqual(getVisitingTimesForDay(doctor, 2), [])
  assert.deepEqual(
    getVisitingTimesForDay({ visitingDays: [2] }, 2),
    APPOINTMENT_TIMES,
  )
})

test('appointment time list is fixed and valid', () => {
  assert.equal(APPOINTMENT_TIMES.length, 8)
  assert.equal(APPOINTMENT_TIMES.includes('09:00'), true)
  assert.equal(APPOINTMENT_TIMES.includes('17:00'), true)
})

test('advance date helpers format UTC dates', () => {
  const date = new Date('2026-11-21T12:00:00.000Z')
  assert.equal(formatDate(addUtcDays(date, 7)), '2026-11-28')
})

test('calculateFee applies the 300 discount only with qualifying appointment history', async () => {
  const originalFindOne = Appointment.findOne

  Appointment.findOne = () => ({
    lean: async () => ({
      _id: 'prior-appointment',
      appointmentDate: '2026-10-10',
    }),
  })

  try {
    assert.deepEqual(
      await calculateFee('patient-1', 'doc1', '2027-01-10'),
      { fee: 700, discountApplied: true },
    )
  } finally {
    Appointment.findOne = originalFindOne
  }
})

test('calculateFee returns 1000 without qualifying appointment history', async () => {
  const originalFindOne = Appointment.findOne

  Appointment.findOne = () => ({
    lean: async () => null,
  })

  try {
    assert.deepEqual(
      await calculateFee('patient-1', 'doc1', '2027-01-10'),
      { fee: 1000, discountApplied: false },
    )
  } finally {
    Appointment.findOne = originalFindOne
  }
})
