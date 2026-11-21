import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    order: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    division: { type: String, required: true, trim: true },
    about: { type: String, required: true, trim: true },
    fees: { type: Number, required: true, min: 0, default: 1000 },
    visitingDays: {
      type: [Number],
      enum: [0, 1, 2, 3, 4, 5, 6],
      default: [1, 2, 3, 4, 5],
      validate: {
        validator: (days) => days.length > 0,
        message: 'At least one visiting day is required.',
      },
    },
    visitingHours: [
      {
        day: {
          type: Number,
          required: true,
          enum: [0, 1, 2, 3, 4, 5, 6],
        },
        startTime: {
          type: String,
          required: true,
          match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        endTime: {
          type: String,
          required: true,
          match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
      },
    ],
    temporaryUnavailability: {
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      returnDate: { type: String, default: '' },
      reason: { type: String, trim: true, default: '' },
    },
    address: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, required: true, trim: true },
    },
  },
  { timestamps: true },
)

const Doctor = mongoose.model('Doctor', doctorSchema)

export default Doctor
