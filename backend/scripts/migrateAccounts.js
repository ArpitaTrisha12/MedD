import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import User from '../models/User.js'
import Patient from '../models/Patient.js'
import DoctorAccount from '../models/DoctorAccount.js'
import Admin from '../models/Admin.js'
import Doctor from '../models/Doctor.js'

const migrateAccounts = async () => {
  await connectDB()

  try {
    const users = await User.find().select('+passwordHash').lean()
    const existingEmails = new Map()

    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase()
      const previous = existingEmails.get(normalizedEmail)
      if (previous) {
        throw new Error(`Duplicate account email found in users collection: ${normalizedEmail}`)
      }
      existingEmails.set(normalizedEmail, user.role)
    }

    const profileIds = new Set(
      (await Doctor.find().select('_id').lean()).map((profile) => profile._id),
    )

    const counts = { patients: 0, doctorAccounts: 0, admins: 0, skipped: 0 }

    for (const user of users) {
      if (user.role === 'Patient') {
        await Patient.updateOne(
          { _id: user._id },
          {
            $setOnInsert: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              passwordHash: user.passwordHash,
              isActive: user.isActive,
              phone: user.phone || '',
              age: user.age ?? null,
              gender: user.gender || '',
              address: user.address || '',
            },
          },
          { upsert: true },
        )
        counts.patients += 1
      } else if (user.role === 'Doctor') {
        if (!user.doctorId || !profileIds.has(user.doctorId)) {
          counts.skipped += 1
          continue
        }
        await DoctorAccount.updateOne(
          { _id: user._id },
          {
            $setOnInsert: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              passwordHash: user.passwordHash,
              doctorId: user.doctorId,
              isActive: user.isActive,
              phone: user.phone || '',
              address: user.address || '',
            },
          },
          { upsert: true },
        )
        counts.doctorAccounts += 1
      } else if (user.role === 'Admin') {
        await Admin.updateOne(
          { _id: user._id },
          {
            $setOnInsert: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              passwordHash: user.passwordHash,
              isActive: user.isActive,
            },
          },
          { upsert: true },
        )
        counts.admins += 1
      }
    }

    console.log(`Account migration complete: ${JSON.stringify(counts)}`)
  } finally {
    await mongoose.disconnect()
  }
}

migrateAccounts().catch((error) => {
  console.error('Account migration failed:', error.message)
  process.exitCode = 1
})
