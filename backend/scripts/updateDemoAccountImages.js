import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Patient from '../models/Patient.js'
import DoctorAccount from '../models/DoctorAccount.js'
import Admin from '../models/Admin.js'

const patientImages = [
  ['arif.patient@gmail.com', 'https://randomuser.me/api/portraits/men/32.jpg'],
  ['nusrat.patient@gmail.com', 'https://randomuser.me/api/portraits/women/65.jpg'],
  ['tanvir.patient@gmail.com', 'https://randomuser.me/api/portraits/men/75.jpg'],
  ['sadia.patient@gmail.com', 'https://randomuser.me/api/portraits/women/44.jpg'],
  ['fahim.patient@gmail.com', 'https://randomuser.me/api/portraits/men/46.jpg'],
  ['mim.patient@gmail.com', 'https://randomuser.me/api/portraits/women/68.jpg'],
  ['rakib.patient@gmail.com', 'https://randomuser.me/api/portraits/men/52.jpg'],
  ['sumaiya.patient@gmail.com', 'https://randomuser.me/api/portraits/women/33.jpg'],
]

const doctorImages = [
  ['mahmud.doctor@gmail.com', 'https://randomuser.me/api/portraits/men/11.jpg'],
  ['farhana.doctor@gmail.com', 'https://randomuser.me/api/portraits/women/12.jpg'],
  ['tanvir.doctor@gmail.com', 'https://randomuser.me/api/portraits/men/13.jpg'],
  ['nusrat.doctor@gmail.com', 'https://randomuser.me/api/portraits/women/26.jpg'],
  ['sakib.doctor@gmail.com', 'https://randomuser.me/api/portraits/men/22.jpg'],
  ['samira.doctor@gmail.com', 'https://randomuser.me/api/portraits/women/29.jpg'],
]

const adminImage = '/src/assets/admin-profile.jpg'

const updateDemoAccountImages = async () => {
  await connectDB()

  try {
    let patientsUpdated = 0
    let doctorsUpdated = 0
    let adminsUpdated = 0

    for (const [email, image] of patientImages) {
      const result = await Patient.updateOne(
        { email: email.toLowerCase() },
        { $set: { image } },
      )
      patientsUpdated += result.matchedCount
    }

    for (const [email, image] of doctorImages) {
      const result = await DoctorAccount.updateOne(
        { email: email.toLowerCase() },
        { $set: { image } },
      )
      doctorsUpdated += result.matchedCount
    }

    const adminResult = await Admin.updateMany(
      {},
      { $set: { image: adminImage } },
    )
    adminsUpdated = adminResult.matchedCount

    console.log(
      `Demo account images updated: ${patientsUpdated} patients, ${doctorsUpdated} doctors, ${adminsUpdated} admin.`,
    )
  } finally {
    await mongoose.disconnect()
  }
}

updateDemoAccountImages().catch((error) => {
  console.error('Demo account image update failed:', error.message)
  process.exitCode = 1
})
