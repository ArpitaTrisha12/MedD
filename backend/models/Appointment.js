import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: String,
      ref: 'Doctor',
      required: true,
    },
    appointmentDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    appointmentTime: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      enum: [700, 1000],
    },
    discountApplied: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true },
)

appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'Cancelled' } },
  },
)

appointmentSchema.index(
  { patient: 1, doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'Cancelled' } },
  },
)

appointmentSchema.index({ patient: 1, appointmentDate: 1 })
appointmentSchema.index({ doctor: 1, appointmentDate: 1 })

const Appointment = mongoose.model('Appointment', appointmentSchema)

export default Appointment
