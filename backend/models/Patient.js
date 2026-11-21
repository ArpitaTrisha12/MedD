import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    phone: { type: String, default: '', trim: true },
    age: { type: Number, min: 0, default: null },
    gender: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

const Patient = mongoose.model('Patient', patientSchema)

export default Patient
