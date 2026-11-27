import assert from 'node:assert/strict'
import test from 'node:test'
import Appointment from '../models/Appointment.js'
import AuditLog from '../models/AuditLog.js'
import { confirmAppointment } from '../controllers/appointmentController.js'

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(statusCode) {
    this.statusCode = statusCode
    return this
  },
  json(body) {
    this.body = body
    return this
  },
})

test('doctor confirmation changes a pending appointment and records a safe audit event', async () => {
  const originalFindOne = Appointment.findOne
  const originalAuditCreate = AuditLog.create
  const appointment = {
    _id: '507f1f77bcf86cd799439012',
    status: 'Pending',
    save: async () => {},
  }
  let auditEntry
  Appointment.findOne = async () => appointment
  AuditLog.create = async (entry) => {
    auditEntry = entry
    return entry
  }

  try {
    const res = createResponse()
    await confirmAppointment(
      {
        params: { id: appointment._id },
        user: { _id: '507f1f77bcf86cd799439011', doctorId: 'doc1' },
      },
      res,
      (error) => { throw error },
    )

    assert.equal(appointment.status, 'Confirmed')
    assert.equal(res.body.appointment, appointment)
    assert.deepEqual(auditEntry, {
      action: 'Appointment confirmed',
      userId: '507f1f77bcf86cd799439011',
      userRole: 'Doctor',
      relatedRecordId: appointment._id,
      module: 'appointments',
      operationType: 'UPDATE',
    })
  } finally {
    Appointment.findOne = originalFindOne
    AuditLog.create = originalAuditCreate
  }
})

test('only pending appointments can be confirmed', async () => {
  const originalFindOne = Appointment.findOne
  const originalAuditCreate = AuditLog.create
  let saved = false
  let audited = false
  Appointment.findOne = async () => ({
    _id: '507f1f77bcf86cd799439012',
    status: 'Cancelled',
    save: async () => { saved = true },
  })
  AuditLog.create = async () => { audited = true }

  try {
    const res = createResponse()
    await confirmAppointment(
      {
        params: { id: '507f1f77bcf86cd799439012' },
        user: { _id: '507f1f77bcf86cd799439011', doctorId: 'doc1' },
      },
      res,
      (error) => { throw error },
    )
    assert.equal(res.statusCode, 409)
    assert.equal(saved, false)
    assert.equal(audited, false)
  } finally {
    Appointment.findOne = originalFindOne
    AuditLog.create = originalAuditCreate
  }
})
