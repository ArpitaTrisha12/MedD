import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Patient from '../models/Patient.js'
import DoctorAccount from '../models/DoctorAccount.js'
import Admin from '../models/Admin.js'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'
import { recordAudit } from '../services/auditLogService.js'

const demoPatients = [
  { fullName: 'Arif Hossain', email: 'arif.patient@gmail.com', passwordKey: 'arifPatient', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { fullName: 'Nusrat Jahan', email: 'nusrat.patient@gmail.com', passwordKey: 'nusratPatient', image: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { fullName: 'Tanvir Ahmed', email: 'tanvir.patient@gmail.com', passwordKey: 'tanvirPatient', image: 'https://randomuser.me/api/portraits/men/75.jpg' },
  { fullName: 'Sadia Islam', email: 'sadia.patient@gmail.com', passwordKey: 'sadiaPatient', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { fullName: 'Fahim Rahman', email: 'fahim.patient@gmail.com', passwordKey: 'fahimPatient', image: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { fullName: 'Mim Akter', email: 'mim.patient@gmail.com', passwordKey: 'mimPatient', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { fullName: 'Rakib Hasan', email: 'rakib.patient@gmail.com', passwordKey: 'rakibPatient', image: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { fullName: 'Sumaiya Akter', email: 'sumaiya.patient@gmail.com', passwordKey: 'sumaiyaPatient', image: 'https://randomuser.me/api/portraits/women/33.jpg' },
]

const demoDoctors = [
  { fullName: 'Dr. Mahmud Hasan', email: 'mahmud.doctor@gmail.com', passwordKey: 'mahmudDoctor', doctorId: 'doc1', speciality: 'General physician', image: 'https://randomuser.me/api/portraits/men/11.jpg' },
  { fullName: 'Dr. Farhana Rahman', email: 'farhana.doctor@gmail.com', passwordKey: 'farhanaDoctor', doctorId: 'doc2', speciality: 'Gynecologist', image: 'https://randomuser.me/api/portraits/women/12.jpg' },
  { fullName: 'Dr. Tanvir Islam', email: 'tanvir.doctor@gmail.com', passwordKey: 'tanvirDoctor', doctorId: 'doc3', speciality: 'Dermatologist', image: 'https://randomuser.me/api/portraits/men/13.jpg' },
  { fullName: 'Dr. Nusrat Sultana', email: 'nusrat.doctor@gmail.com', passwordKey: 'nusratDoctor', doctorId: 'doc4', speciality: 'Pediatricians', image: 'https://randomuser.me/api/portraits/women/26.jpg' },
  { fullName: 'Dr. Sakib Ahmed', email: 'sakib.doctor@gmail.com', passwordKey: 'sakibDoctor', doctorId: 'doc5', speciality: 'Neurologist', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { fullName: 'Dr. Samira Khan', email: 'samira.doctor@gmail.com', passwordKey: 'samiraDoctor', doctorId: 'doc16', speciality: 'Cardiologist', image: 'https://randomuser.me/api/portraits/women/29.jpg' },
]

const demoAdmin = {
  fullName: 'MedD Administrator',
  email: 'admin.medd@gmail.com',
  passwordKey: 'admin',
  image: '/src/assets/admin-profile.jpg',
}

const provisionDemoAccounts = async () => {
  let passwords
  try {
    passwords = JSON.parse(process.env.DEMO_PASSWORDS_JSON || '{}')
  } catch {
    throw new Error('DEMO_PASSWORDS_JSON must contain valid JSON.')
  }

  const requiredKeys = [
    ...demoPatients.map((item) => item.passwordKey),
    ...demoDoctors.map((item) => item.passwordKey),
    demoAdmin.passwordKey,
  ]
  const missingKeys = requiredKeys.filter(
    (key) => typeof passwords[key] !== 'string' || passwords[key].length < 7,
  )
  if (missingKeys.length > 0) {
    throw new Error(`Missing or invalid demo password keys: ${missingKeys.join(', ')}`)
  }

  await connectDB()
  const result = {
    patientsCreated: 0,
    patientDuplicatesSkipped: 0,
    doctorsCreated: 0,
    doctorDuplicatesSkipped: 0,
    adminsCreated: 0,
    adminDuplicatesSkipped: 0,
  }

  try {
    const [patients, doctors, admins, legacyUsers] = await Promise.all([
      Patient.find().select('email').lean(),
      DoctorAccount.find().select('email doctorId').lean(),
      Admin.find().select('email').lean(),
      User.find().select('email').lean(),
    ])

    const patientEmails = new Set(patients.map((item) => item.email))
    const doctorEmails = new Set(doctors.map((item) => item.email))
    const adminEmails = new Set(admins.map((item) => item.email))
    const doctorIds = new Set(doctors.map((item) => item.doctorId))
    const legacyEmails = new Set(legacyUsers.map((item) => item.email))

    for (const patient of demoPatients) {
      const email = patient.email.toLowerCase()
      if (patientEmails.has(email)) {
        await Patient.updateOne({ email }, { $set: { image: patient.image } })
        result.patientDuplicatesSkipped += 1
        continue
      }
      if (legacyEmails.has(email)) {
        result.patientDuplicatesSkipped += 1
        continue
      }
      const passwordHash = await bcrypt.hash(passwords[patient.passwordKey], 12)
      const createdPatient = await Patient.create({
        fullName: patient.fullName,
        email,
        passwordHash,
        isActive: true,
        image: patient.image,
      })
      await recordAudit({
        action: 'Patient account created',
        userId: createdPatient._id,
        userRole: 'Patient',
        relatedRecordId: createdPatient._id,
        module: 'patients',
        operationType: 'CREATE',
      })
      patientEmails.add(email)
      result.patientsCreated += 1
    }

    let cardioProfile = await Doctor.findOne({
      speciality: 'Cardiologist',
    }).lean()

    if (!cardioProfile) {
      cardioProfile = await Doctor.create({
        _id: 'doc16',
        order: 16,
        name: 'Dr. Samira Khan',
        image: '/src/assets/doc12.png',
        speciality: 'Cardiologist',
        degree: 'MBBS',
        experience: '4 Years',
        division: 'Dhaka',
        visitingDays: [1, 3, 5],
        visitingHours: [
          { day: 1, startTime: '09:00', endTime: '13:00' },
          { day: 3, startTime: '14:00', endTime: '18:00' },
          { day: 5, startTime: '09:00', endTime: '13:00' },
        ],
        temporaryUnavailability: {
          startDate: '',
          endDate: '',
          returnDate: '',
          reason: '',
        },
        about: 'Dr. Samira Khan provides cardiology care, preventive heart health guidance, diagnosis and treatment.',
        fees: 1000,
        address: { line1: 'Dhanmondi', line2: 'Dhaka, Bangladesh' },
      })
    }

    for (const doctor of demoDoctors) {
      const email = doctor.email.toLowerCase()
      const doctorId = doctor.doctorId === 'doc16'
        ? cardioProfile._id
        : doctor.doctorId

      if (doctorEmails.has(email)) {
        await DoctorAccount.updateOne({ email }, { $set: { image: doctor.image } })
        result.doctorDuplicatesSkipped += 1
        continue
      }
      if (legacyEmails.has(email)) {
        result.doctorDuplicatesSkipped += 1
        continue
      }
      if (doctorIds.has(doctorId)) {
        result.doctorDuplicatesSkipped += 1
        continue
      }

      const profile = await Doctor.findById(doctorId).lean()
      if (!profile) {
        throw new Error(`Doctor profile ${doctorId} was not found for ${doctor.fullName}.`)
      }

      const passwordHash = await bcrypt.hash(passwords[doctor.passwordKey], 12)
      const createdAccount = await DoctorAccount.create({
        fullName: doctor.fullName,
        email,
        passwordHash,
        doctorId,
        isActive: true,
        image: doctor.image,
      })
      await recordAudit({
        action: 'Doctor account created',
        userId: createdAccount._id,
        userRole: 'Doctor',
        relatedRecordId: createdAccount._id,
        module: 'doctorAccounts',
        operationType: 'CREATE',
      })
      doctorEmails.add(email)
      doctorIds.add(doctorId)
      result.doctorsCreated += 1
    }

    const adminEmail = demoAdmin.email.toLowerCase()
    if (adminEmails.has(adminEmail)) {
      await Admin.updateOne({ email: adminEmail }, { $set: { image: demoAdmin.image } })
      result.adminDuplicatesSkipped += 1
    } else if (legacyEmails.has(adminEmail)) {
      result.adminDuplicatesSkipped += 1
    } else {
      const passwordHash = await bcrypt.hash(passwords[demoAdmin.passwordKey], 12)
      const createdAdmin = await Admin.create({
        fullName: demoAdmin.fullName,
        email: adminEmail,
        passwordHash,
        isActive: true,
        image: demoAdmin.image,
      })
      await recordAudit({
        action: 'Admin account created',
        userId: createdAdmin._id,
        userRole: 'Admin',
        relatedRecordId: createdAdmin._id,
        module: 'admins',
        operationType: 'CREATE',
      })
      result.adminsCreated += 1
    }

    console.log(`Demo account provisioning complete: ${JSON.stringify(result)}`)
  } finally {
    await mongoose.disconnect()
  }
}

provisionDemoAccounts().catch((error) => {
  console.error('Demo account provisioning failed:', error.message)
  process.exitCode = 1
})
