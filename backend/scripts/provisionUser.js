import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import DoctorAccount from '../models/DoctorAccount.js'
import Doctor from '../models/Doctor.js'

const provisionUser = async () => {
  const fullName = process.env.PROVISION_NAME?.trim()
  const email = process.env.PROVISION_EMAIL?.trim().toLowerCase()
  const role = process.env.PROVISION_ROLE
  const password = process.env.PROVISION_PASSWORD
  const doctorId = process.env.PROVISION_DOCTOR_ID?.trim() || ''
  delete process.env.PROVISION_PASSWORD

  if (
    !fullName ||
    !email ||
    role !== 'Doctor' ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    throw new Error(
      'Set PROVISION_NAME, PROVISION_EMAIL, PROVISION_ROLE=Doctor, PROVISION_DOCTOR_ID, and a password of at least 8 characters.',
    )
  }

  await connectDB()

  try {
    if (!doctorId) {
      throw new Error('PROVISION_DOCTOR_ID is required for a Doctor account.')
    }
    const profile = await Doctor.findById(doctorId).lean()
    if (!profile) {
      throw new Error('The linked doctor profile does not exist.')
    }
    const existingProfile = await DoctorAccount.findOne({ doctorId })
    if (existingProfile) {
      throw new Error('This doctor profile already has a login account.')
    }
    const passwordHash = await bcrypt.hash(password, 12)
    await DoctorAccount.create({ fullName, email, passwordHash, doctorId })
    console.log('Doctor account provisioned.')
  } finally {
    await mongoose.disconnect()
  }
}

provisionUser().catch((error) => {
  console.error('Account provisioning failed:', error.message)
  process.exitCode = 1
})
