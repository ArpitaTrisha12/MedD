import assert from 'node:assert/strict'
import test from 'node:test'
import { requireRole } from '../middleware/authMiddleware.js'

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

test('requireRole rejects an unauthenticated request', () => {
  const res = createResponse()
  let continued = false

  requireRole('Admin')({}, res, () => {
    continued = true
  })

  assert.equal(res.statusCode, 401)
  assert.equal(continued, false)
})

test('requireRole rejects a user with a different role', () => {
  const res = createResponse()
  let continued = false

  requireRole('Admin')({ user: { role: 'Patient' } }, res, () => {
    continued = true
  })

  assert.equal(res.statusCode, 403)
  assert.equal(continued, false)
})

test('requireRole continues for an allowed role', () => {
  const res = createResponse()
  let continued = false

  requireRole('Admin', 'Doctor')({ user: { role: 'Doctor' } }, res, () => {
    continued = true
  })

  assert.equal(res.statusCode, 200)
  assert.equal(continued, true)
})
