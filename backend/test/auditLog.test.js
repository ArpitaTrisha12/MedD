import assert from 'node:assert/strict'
import test from 'node:test'
import AuditLog from '../models/AuditLog.js'
import { getAuditHistory } from '../controllers/auditLogController.js'
import { recordAudit } from '../services/auditLogService.js'

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

test('AuditLog schema is timestamped, append-only, and stores only audit fields', () => {
  assert.equal(AuditLog.collection.name, 'auditlogs')
  assert.equal(AuditLog.schema.path('createdAt') !== undefined, true)
  assert.equal(AuditLog.schema.path('updatedAt'), undefined)
  assert.deepEqual(
    Object.keys(AuditLog.schema.paths).filter((path) => !['_id', '__v', 'createdAt'].includes(path)).sort(),
    ['action', 'module', 'operationType', 'relatedRecordId', 'userId', 'userRole'].sort(),
  )
})

test('audit service ignores caller fields outside the safe audit schema', async () => {
  const originalCreate = AuditLog.create
  let insertedEntry
  AuditLog.create = async (entry) => {
    insertedEntry = entry
    return entry
  }

  try {
    await recordAudit({
      action: 'Prescription created',
      userId: '507f1f77bcf86cd799439011',
      userRole: 'Doctor',
      relatedRecordId: '507f1f77bcf86cd799439012',
      module: 'prescriptions',
      operationType: 'CREATE',
      diagnosis: 'must not be recorded',
    })
    assert.deepEqual(insertedEntry, {
      action: 'Prescription created',
      userId: '507f1f77bcf86cd799439011',
      userRole: 'Doctor',
      relatedRecordId: '507f1f77bcf86cd799439012',
      module: 'prescriptions',
      operationType: 'CREATE',
    })
  } finally {
    AuditLog.create = originalCreate
  }
})

test('audit history applies role, action, module, inclusive date and pagination filters', async () => {
  const originalFind = AuditLog.find
  const originalCountDocuments = AuditLog.countDocuments
  let observedFilter
  let observedSkip
  let observedLimit

  AuditLog.find = (filter) => {
    observedFilter = filter
    const query = {
      sort() { return this },
      skip(value) { observedSkip = value; return this },
      limit(value) { observedLimit = value; return this },
      lean: async () => [],
    }
    return query
  }
  AuditLog.countDocuments = async () => 0

  try {
    const res = createResponse()
    await getAuditHistory(
      {
        query: {
          from: '2026-10-01',
          to: '2026-10-31',
          userRole: 'Doctor',
          operationType: 'UPDATE',
          module: 'appointments',
          page: '2',
          limit: '10',
        },
      },
      res,
      (error) => { throw error },
    )

    assert.deepEqual(observedFilter.userRole, 'Doctor')
    assert.deepEqual(observedFilter.operationType, 'UPDATE')
    assert.deepEqual(observedFilter.module, 'appointments')
    assert.equal(observedFilter.createdAt.$gte.toISOString(), '2026-10-01T00:00:00.000Z')
    assert.equal(observedFilter.createdAt.$lt.toISOString(), '2026-11-01T00:00:00.000Z')
    assert.equal(observedSkip, 10)
    assert.equal(observedLimit, 10)
    assert.equal(res.body.page, 2)
  } finally {
    AuditLog.find = originalFind
    AuditLog.countDocuments = originalCountDocuments
  }
})

test('audit history rejects invalid filters before querying MongoDB', async () => {
  const originalFind = AuditLog.find
  let queried = false
  AuditLog.find = () => {
    queried = true
    throw new Error('Should not query invalid filters.')
  }

  try {
    const res = createResponse()
    await getAuditHistory(
      { query: { module: 'patients; delete all', page: '1', limit: '50' } },
      res,
      (error) => { throw error },
    )
    assert.equal(res.statusCode, 400)
    assert.equal(queried, false)
  } finally {
    AuditLog.find = originalFind
  }
})

test('audit update and delete queries are rejected before reaching MongoDB', async () => {
  await assert.rejects(
    AuditLog.updateOne({}, { $set: { action: 'altered' } }).exec(),
    /Audit records are immutable/,
  )
  await assert.rejects(
    AuditLog.deleteMany({}).exec(),
    /Audit records are immutable/,
  )
})
