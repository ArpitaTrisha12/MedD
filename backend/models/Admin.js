import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

const Admin = mongoose.model('Admin', adminSchema)

export default Admin
