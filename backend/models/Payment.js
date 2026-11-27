import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    provider: {
      type: String,
      enum: ['sslcommerz', 'nagad'],
      required: true,
    },
    method: {
      type: String,
      enum: ['bkash', 'card', 'nagad'],
      required: true,
    },
    cardBrand: {
      type: String,
      enum: ['visa', 'mastercard'],
      default: undefined,
    },
    amount: {
      type: Number,
      required: true,
      min: 10,
      max: 500000,
    },
    currency: {
      type: String,
      enum: ['BDT'],
      default: 'BDT',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Cancelled'],
      default: 'Pending',
      required: true,
    },
    merchantTransactionId: {
      type: String,
      required: true,
      unique: true,
    },
    gatewayTransactionId: {
      type: String,
      default: '',
    },
    gatewaySessionId: {
      type: String,
      maxlength: 50,
      select: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

paymentSchema.index({ patient: 1, createdAt: -1 })
paymentSchema.index({ appointment: 1, status: 1 })
paymentSchema.index(
  { appointment: 1 },
  { unique: true, partialFilterExpression: { status: 'Pending' } },
)
paymentSchema.index(
  { appointment: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Pending', 'Paid'] } },
    name: 'appointment_single_active_payment',
  },
)

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
