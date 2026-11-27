import assert from 'node:assert/strict'
import test from 'node:test'
import Appointment from '../models/Appointment.js'
import AuditLog from '../models/AuditLog.js'
import Payment from '../models/Payment.js'
import {
  handleSslCommerzSuccess,
  initiatePayment,
} from '../controllers/paymentController.js'

const createResponse = () => ({
  statusCode: 200,
  body: null,
  text: null,
  redirectCode: null,
  redirectUrl: null,
  status(statusCode) {
    this.statusCode = statusCode
    return this
  },
  json(body) {
    this.body = body
    return this
  },
  send(text) {
    this.text = text
    return this
  },
  redirect(statusCode, url) {
    this.redirectCode = statusCode
    this.redirectUrl = url
    return this
  },
})

const withPaymentEnvironment = async (run) => {
  const keys = [
    'SSLCOMMERZ_MODE',
    'SSLCOMMERZ_STORE_ID',
    'SSLCOMMERZ_STORE_PASSWORD',
    'PAYMENT_CALLBACK_BASE_URL',
    'CLIENT_ORIGIN',
  ]
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  process.env.SSLCOMMERZ_MODE = 'sandbox'
  process.env.SSLCOMMERZ_STORE_ID = 'sandbox-store'
  process.env.SSLCOMMERZ_STORE_PASSWORD = 'test-secret'
  process.env.PAYMENT_CALLBACK_BASE_URL = 'https://api.example.test'
  process.env.CLIENT_ORIGIN = 'https://medd.example.test'

  try {
    await run()
  } finally {
    keys.forEach((key) => {
      if (original[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original[key]
      }
    })
  }
}

test('Payment schema stores safe payment references in the payments collection', () => {
  assert.equal(Payment.collection.name, 'payments')
  assert.equal(Payment.schema.path('patient') !== undefined, true)
  assert.equal(Payment.schema.path('appointment') !== undefined, true)
  assert.equal(Payment.schema.path('status').enumValues.join(','), 'Pending,Paid,Failed')
  assert.equal(Payment.schema.path('cardNumber'), undefined)
  assert.equal(Payment.schema.path('cvv'), undefined)
})

test('AuditLog accepts payment activity records', () => {
  const audit = new AuditLog({
    action: 'Payment initiated',
    userId: '507f1f77bcf86cd799439011',
    userRole: 'Patient',
    relatedRecordId: '507f1f77bcf86cd799439012',
    module: 'payments',
    operationType: 'CREATE',
  })

  assert.equal(audit.validateSync(), undefined)
})

test('checkout uses the appointment fee and selected SSLCOMMERZ channel', async () => {
  await withPaymentEnvironment(async () => {
    const originals = {
      appointmentFindOne: Appointment.findOne,
      paymentFindOne: Payment.findOne,
      paymentCreate: Payment.create,
      auditCreate: AuditLog.create,
      fetch: globalThis.fetch,
    }
    const appointment = {
      _id: '507f1f77bcf86cd799439012',
      fee: 700,
      status: 'Pending',
    }
    let createdPayment
    let formFields
    let auditEntry

    Appointment.findOne = async () => appointment
    Payment.findOne = (filter) => {
      if (filter.status === 'Paid') {
        return { lean: async () => null }
      }
      return null
    }
    Payment.create = async (document) => {
      createdPayment = {
        ...document,
        _id: '507f1f77bcf86cd799439013',
        save: async () => {},
      }
      return createdPayment
    }
    AuditLog.create = async (entry) => {
      auditEntry = entry
      return entry
    }
    globalThis.fetch = async (_url, options) => {
      formFields = new URLSearchParams(options.body)
      return {
        ok: true,
        json: async () => ({
          status: 'SUCCESS',
          GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v4/test-session',
        }),
      }
    }

    try {
      const res = createResponse()
      await initiatePayment(
        {
          body: {
            appointmentId: appointment._id,
            method: 'bkash',
            amount: 1,
          },
          user: {
            _id: '507f1f77bcf86cd799439011',
            fullName: 'Patient Name',
            email: 'patient@example.test',
            phone: '01700000000',
            address: '',
          },
        },
        res,
        (error) => { throw error },
      )

      assert.equal(createdPayment.amount, 700)
      assert.equal(createdPayment.status, 'Pending')
      assert.equal(formFields.get('total_amount'), '700.00')
      assert.equal(formFields.get('multi_card_name'), 'bkash')
      assert.equal(formFields.get('store_passwd'), 'test-secret')
      assert.equal(res.body.checkoutUrl, 'https://sandbox.sslcommerz.com/gwprocess/v4/test-session')
      assert.equal(JSON.stringify(res.body).includes('test-secret'), false)
      assert.equal(auditEntry.action, 'Payment initiated')
    } finally {
      Appointment.findOne = originals.appointmentFindOne
      Payment.findOne = originals.paymentFindOne
      Payment.create = originals.paymentCreate
      AuditLog.create = originals.auditCreate
      globalThis.fetch = originals.fetch
    }
  })
})

test('checkout does not write a payment when SSLCOMMERZ is not configured', async () => {
  const originals = {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    callbackUrl: process.env.PAYMENT_CALLBACK_BASE_URL,
    paymentCreate: Payment.create,
  }
  delete process.env.SSLCOMMERZ_STORE_ID
  delete process.env.SSLCOMMERZ_STORE_PASSWORD
  delete process.env.PAYMENT_CALLBACK_BASE_URL
  let created = false
  Payment.create = async () => { created = true }

  try {
    const res = createResponse()
    await initiatePayment(
      {
        body: {
          appointmentId: '507f1f77bcf86cd799439012',
          method: 'bkash',
        },
        user: { _id: '507f1f77bcf86cd799439011', phone: '01700000000' },
      },
      res,
      (error) => { throw error },
    )
    assert.equal(res.statusCode, 503)
    assert.equal(created, false)
  } finally {
    Payment.create = originals.paymentCreate
    if (originals.storeId !== undefined) process.env.SSLCOMMERZ_STORE_ID = originals.storeId
    if (originals.storePassword !== undefined) process.env.SSLCOMMERZ_STORE_PASSWORD = originals.storePassword
    if (originals.callbackUrl !== undefined) process.env.PAYMENT_CALLBACK_BASE_URL = originals.callbackUrl
  }
})

test('checkout requires the appointment to belong to the authenticated patient', async () => {
  await withPaymentEnvironment(async () => {
    const originals = {
      appointmentFindOne: Appointment.findOne,
      paymentCreate: Payment.create,
    }
    let created = false
    Appointment.findOne = async (filter) => {
      assert.equal(filter._id, '507f1f77bcf86cd799439012')
      assert.equal(filter.patient, '507f1f77bcf86cd799439011')
      return null
    }
    Payment.create = async () => { created = true }

    try {
      const res = createResponse()
      await initiatePayment(
        {
          body: {
            appointmentId: '507f1f77bcf86cd799439012',
            method: 'bkash',
          },
          user: {
            _id: '507f1f77bcf86cd799439011',
            phone: '01700000000',
          },
        },
        res,
        (error) => { throw error },
      )
      assert.equal(res.statusCode, 404)
      assert.equal(created, false)
    } finally {
      Appointment.findOne = originals.appointmentFindOne
      Payment.create = originals.paymentCreate
    }
  })
})

test('success callback refuses a provider validation with a mismatched amount', async () => {
  await withPaymentEnvironment(async () => {
    const originals = {
      paymentFindOne: Payment.findOne,
      paymentFindOneAndUpdate: Payment.findOneAndUpdate,
      fetch: globalThis.fetch,
    }
    let paidUpdateAttempted = false
    const payment = {
      _id: '507f1f77bcf86cd799439013',
      patient: '507f1f77bcf86cd799439011',
      amount: 700,
      currency: 'BDT',
      status: 'Pending',
      merchantTransactionId: 'MDtransaction',
    }
    Payment.findOne = async () => payment
    Payment.findOneAndUpdate = async () => {
      paidUpdateAttempted = true
      return payment
    }
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: 'VALID',
        tran_id: payment.merchantTransactionId,
        amount: '1000',
        currency: 'BDT',
        risk_level: '0',
        val_id: 'gateway-validation-id',
      }),
    })

    try {
      const res = createResponse()
      await handleSslCommerzSuccess(
        { body: { tran_id: payment.merchantTransactionId, val_id: 'gateway-validation-id' } },
        res,
        (error) => { throw error },
      )
      assert.equal(res.statusCode, 400)
      assert.equal(paidUpdateAttempted, false)
    } finally {
      Payment.findOne = originals.paymentFindOne
      Payment.findOneAndUpdate = originals.paymentFindOneAndUpdate
      globalThis.fetch = originals.fetch
    }
  })
})

test('success callback records Paid only after matching provider validation', async () => {
  await withPaymentEnvironment(async () => {
    const originals = {
      paymentFindOne: Payment.findOne,
      paymentFindOneAndUpdate: Payment.findOneAndUpdate,
      auditCreate: AuditLog.create,
      fetch: globalThis.fetch,
    }
    const payment = {
      _id: '507f1f77bcf86cd799439013',
      patient: '507f1f77bcf86cd799439011',
      amount: 700,
      currency: 'BDT',
      status: 'Pending',
      merchantTransactionId: 'MDtransaction',
    }
    let auditEntry
    Payment.findOne = async () => payment
    Payment.findOneAndUpdate = async (_filter, update) => {
      Object.assign(payment, update.$set)
      return payment
    }
    AuditLog.create = async (entry) => {
      auditEntry = entry
      return entry
    }
    globalThis.fetch = async (url) => {
      assert.match(url, /validationserverAPI\.php\?/)
      return {
        ok: true,
        json: async () => ({
          status: 'VALID',
          tran_id: payment.merchantTransactionId,
          amount: '700.00',
          currency: 'BDT',
          risk_level: 0,
          val_id: 'gateway-validation-id',
        }),
      }
    }

    try {
      const res = createResponse()
      await handleSslCommerzSuccess(
        { body: { tran_id: payment.merchantTransactionId, val_id: 'gateway-validation-id' } },
        res,
        (error) => { throw error },
      )

      assert.equal(payment.status, 'Paid')
      assert.equal(payment.gatewayTransactionId, 'gateway-validation-id')
      assert.equal(res.redirectCode, 303)
      assert.match(res.redirectUrl, /\/payment\/result\?paymentId=/)
      assert.equal(auditEntry.action, 'Payment verified')
    } finally {
      Payment.findOne = originals.paymentFindOne
      Payment.findOneAndUpdate = originals.paymentFindOneAndUpdate
      AuditLog.create = originals.auditCreate
      globalThis.fetch = originals.fetch
    }
  })
})
