import mongoose from 'mongoose'

const doctorAccountSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    doctorId: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

doctorAccountSchema.index({ doctorId: 1 }, { unique: true })

const DoctorAccount = mongoose.model('DoctorAccount', doctorAccountSchema)

export default DoctorAccount
