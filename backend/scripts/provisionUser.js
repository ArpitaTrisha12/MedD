import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import User from '../models/User.js'

const provisionUser = async () => {
  const fullName = process.env.PROVISION_NAME?.trim()
  const email = process.env.PROVISION_EMAIL?.trim().toLowerCase()
  const role = process.env.PROVISION_ROLE
  const password = process.env.PROVISION_PASSWORD
  delete process.env.PROVISION_PASSWORD

  if (
    !fullName ||
    !email ||
    !['Doctor', 'Admin'].includes(role) ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    throw new Error(
      'Set PROVISION_NAME, PROVISION_EMAIL, PROVISION_ROLE (Doctor or Admin), and a password of at least 8 characters.',
    )
  }

  await connectDB()

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({ fullName, email, role, passwordHash })
    console.log(`${role} account provisioned.`)
  } finally {
    await mongoose.disconnect()
  }
}

provisionUser().catch((error) => {
  console.error('Account provisioning failed:', error.message)
  process.exitCode = 1
})
