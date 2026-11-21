import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import doctorSeeds from '../data/doctorSeeds.js'
import Doctor from '../models/Doctor.js'

const migrateDoctors = async () => {
  try {
    await connectDB()

    const operations = doctorSeeds.map(({ _id, ...doctor }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: doctor },
        upsert: true,
      },
    }))

    const result = await Doctor.bulkWrite(operations)
    await Doctor.updateMany(
      {
        $or: [
          { fees: { $in: [50, 60, 30, 40] } },
          { fees: { $exists: false } },
          { fees: null },
        ],
      },
      { $set: { fees: 1000 } },
    )
    const sourceIds = doctorSeeds.map(({ _id }) => _id)
    const migratedCount = await Doctor.countDocuments({
      _id: { $in: sourceIds },
    })

    if (migratedCount !== doctorSeeds.length) {
      throw new Error(
        `Expected ${doctorSeeds.length} migrated doctors, found ${migratedCount}.`,
      )
    }

    console.log(
      `Doctor migration successful: ${migratedCount} records present; ${result.upsertedCount} inserted.`,
    )
  } finally {
    await mongoose.disconnect()
  }
}

migrateDoctors().catch((error) => {
  console.error('Doctor migration failed:', error.message)
  process.exitCode = 1
})
