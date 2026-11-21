import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Admin from '../models/Admin.js'

const provisionAdmin = async () => {
  const fullName = process.env.PROVISION_ADMIN_NAME?.trim()
  const email = process.env.PROVISION_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.PROVISION_ADMIN_PASSWORD
  delete process.env.PROVISION_ADMIN_PASSWORD

  if (
    !fullName ||
    !email ||
    typeof password !== 'string' ||
    password.length < 12
  ) {
    throw new Error(
      'Set PROVISION_ADMIN_NAME, PROVISION_ADMIN_EMAIL, and a password of at least 12 characters.',
    )
  }

  await connectDB()
  try {
    const existing = await Admin.findOne({ email })
    if (existing) {
      throw new Error('An account already exists with this Admin email.')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await Admin.create({ fullName, email, passwordHash, isActive: true })
    console.log('Initial Admin account provisioned securely.')
  } finally {
    await mongoose.disconnect()
  }
}

provisionAdmin().catch((error) => {
  console.error('Admin provisioning failed:', error.message)
  process.exitCode = 1
})
