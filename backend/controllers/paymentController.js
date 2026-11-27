import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import Appointment from '../models/Appointment.js'
import Payment from '../models/Payment.js'
import { recordAudit } from '../services/auditLogService.js'
import {
  createSslCommerzSession,
  isSslCommerzConfigured,
  PaymentGatewayError,
  validateSslCommerzTransaction,
} from '../services/sslCommerzService.js'

const supportedMethods = new Set(['bkash', 'card', 'nagad'])
const cardBrands = new Set(['visa', 'mastercard'])

const resultUrl = (paymentId) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  return `${clientOrigin.replace(/\/+$/, '')}/payment/result?paymentId=${encodeURIComponent(paymentId)}`
}

const respondToCallback = (res, paymentId) => res.redirect(303, resultUrl(paymentId))

const updateVerifiedPayment = async (payment, validation) => {
  const validStatus = ['VALID', 'VALIDATED'].includes(validation.status)
  const matchingTransaction = validation.tran_id === payment.merchantTransactionId
  const matchingAmount = Number(validation.amount) === payment.amount
  const matchingCurrency = validation.currency === payment.currency
  const safeRiskLevel = String(validation.risk_level) === '0'

  if (
    !validStatus ||
    !matchingTransaction ||
    !matchingAmount ||
    !matchingCurrency ||
    !safeRiskLevel ||
    typeof validation.val_id !== 'string'
  ) {
    return false
  }

  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: 'Pending' },
    {
      $set: {
        status: 'Paid',
        gatewayTransactionId: validation.val_id,
        verifiedAt: new Date(),
      },
    },
    { new: true },
  )

  if (updatedPayment) {
    await recordAudit({
      action: 'Payment verified',
      userId: payment.patient,
      userRole: 'Patient',
      relatedRecordId: payment._id,
      module: 'payments',
      operationType: 'UPDATE',
    })
    return true
  }

  const latestPayment = await Payment.findById(payment._id).select('status').lean()
  return latestPayment?.status === 'Paid'
}

export const initiatePayment = async (req, res, next) => {
  try {
    const { appointmentId, method, cardBrand } = req.body ?? {}
    if (!supportedMethods.has(method)) {
      return res.status(400).json({ message: 'Select a supported payment method.' })
    }
    if (method === 'card' && !cardBrands.has(cardBrand)) {
      return res.status(400).json({ message: 'Select Visa or Mastercard.' })
    }
    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: 'Provide a valid appointment reference.' })
    }
    if (method !== 'card' && cardBrand !== undefined) {
      return res.status(400).json({ message: 'Card type is only valid for card payments.' })
    }
    if (method === 'nagad') {
      return res.status(503).json({
        message: 'Nagad checkout is unavailable until its official merchant integration is configured.',
      })
    }
    if (!req.user.phone) {
      return res.status(400).json({
        message: 'Add a phone number to your profile before starting checkout.',
      })
    }

    try {
      if (!isSslCommerzConfigured()) {
        return res.status(503).json({
          message: 'SSLCOMMERZ merchant settings are not configured.',
        })
      }
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        return res.status(error.statusCode).json({ message: error.message })
      }
      throw error
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
    })
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' })
    }
    if (['Cancelled', 'Completed'].includes(appointment.status)) {
      return res.status(409).json({
        message: 'Payment is unavailable for cancelled or completed appointments.',
      })
    }

    const paidPayment = await Payment.findOne({
      appointment: appointment._id,
      status: 'Paid',
    }).lean()
    if (paidPayment) {
      return res.status(409).json({ message: 'This appointment is already paid.' })
    }

    const pendingPayment = await Payment.findOne({
      appointment: appointment._id,
      status: 'Pending',
    })
    if (pendingPayment) {
      return res.status(409).json({
        message: 'A payment attempt is already in progress for this appointment. Check your payment history before retrying.',
      })
    }

    let payment
    try {
      payment = await Payment.create({
        patient: req.user._id,
        appointment: appointment._id,
        provider: 'sslcommerz',
        method,
        ...(method === 'card' ? { cardBrand } : {}),
        amount: appointment.fee,
        currency: 'BDT',
        status: 'Pending',
        merchantTransactionId: `MD${randomBytes(12).toString('hex')}`,
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: 'A payment attempt is already in progress for this appointment.',
        })
      }
      throw error
    }

    await recordAudit({
      action: 'Payment initiated',
      userId: req.user._id,
      userRole: 'Patient',
      relatedRecordId: payment._id,
      module: 'payments',
      operationType: 'CREATE',
    })

    let session
    try {
      session = await createSslCommerzSession({ payment, patient: req.user })
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        return res.status(error.statusCode).json({ message: error.message })
      }
      throw error
    }

    if (!session.success) {
      payment.status = 'Failed'
      await payment.save()
      await recordAudit({
        action: 'Payment failed',
        userId: req.user._id,
        userRole: 'Patient',
        relatedRecordId: payment._id,
        module: 'payments',
        operationType: 'UPDATE',
      })
      return res.status(502).json({ message: 'The payment provider could not start checkout.' })
    }

    res.status(201).json({
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
      },
      checkoutUrl: session.checkoutUrl,
    })
  } catch (error) {
    next(error)
  }
}

export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .select('appointment provider method cardBrand amount currency status merchantTransactionId gatewayTransactionId verifiedAt createdAt')
      .lean()
    res.json(payments)
  } catch (error) {
    next(error)
  }
}

export const getMyPayment = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Payment not found.' })
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })
      .select('appointment provider method cardBrand amount currency status merchantTransactionId gatewayTransactionId verifiedAt createdAt')
      .lean()

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' })
    }

    res.json(payment)
  } catch (error) {
    next(error)
  }
}

const getPendingSslCommerzPayment = async (transactionId) => {
  if (typeof transactionId !== 'string' || transactionId.length > 30) {
    return null
  }
  return Payment.findOne({
    merchantTransactionId: transactionId,
    provider: 'sslcommerz',
  })
}

export const handleSslCommerzSuccess = async (req, res, next) => {
  try {
    const payment = await getPendingSslCommerzPayment(req.body?.tran_id)
    const validationId = req.body?.val_id
    if (!payment || typeof validationId !== 'string' || validationId.length > 100) {
      return res.status(400).send('Payment verification failed.')
    }

    const validation = await validateSslCommerzTransaction(validationId)
    const verified = await updateVerifiedPayment(payment, validation)
    if (!verified) {
      return res.status(400).send('Payment verification failed.')
    }
    respondToCallback(res, payment._id)
  } catch (error) {
    if (error instanceof PaymentGatewayError) {
      return res.status(error.statusCode).send('Payment verification is unavailable.')
    }
    next(error)
  }
}

export const handleSslCommerzIpn = async (req, res, next) => {
  try {
    const payment = await getPendingSslCommerzPayment(req.body?.tran_id)
    const validationId = req.body?.val_id
    if (!payment || typeof validationId !== 'string' || validationId.length > 100) {
      return res.status(400).send('Payment verification failed.')
    }

    const validation = await validateSslCommerzTransaction(validationId)
    if (!(await updateVerifiedPayment(payment, validation))) {
      return res.status(400).send('Payment verification failed.')
    }
    res.status(200).send('OK')
  } catch (error) {
    if (error instanceof PaymentGatewayError) {
      return res.status(error.statusCode).send('Payment verification is unavailable.')
    }
    next(error)
  }
}

export const handleSslCommerzUnsuccessfulReturn = async (req, res, next) => {
  try {
    const payment = await getPendingSslCommerzPayment(req.body?.tran_id)
    if (!payment) {
      return res.status(400).send('Payment reference was not found.')
    }
    respondToCallback(res, payment._id)
  } catch (error) {
    next(error)
  }
}
