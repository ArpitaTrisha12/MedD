import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['Patient', 'Doctor', 'Admin'],
      default: 'Patient',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    doctorId: {
      type: String,
      default: '',
      trim: true,
    },
    phone: { type: String, default: '', trim: true },
    age: { type: Number, min: 0, default: null },
    gender: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    qualification: { type: String, default: '', trim: true },
    speciality: { type: String, default: '', trim: true },
    experience: { type: Number, min: 0, default: null },
    fee: { type: Number, min: 0, default: null },
  },
  { timestamps: true },
)

const User = mongoose.model('User', userSchema)

export default User
