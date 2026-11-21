import bcrypt from 'bcryptjs'
import DoctorAccount from '../models/DoctorAccount.js'
import Doctor from '../models/Doctor.js'

export const listDoctorAccounts = async (_req, res, next) => {
  try {
    const accounts = await DoctorAccount.find()
      .select('_id fullName email doctorId isActive image createdAt updatedAt')
      .sort({ fullName: 1 })
      .lean()
    res.json(accounts)
  } catch (error) {
    next(error)
  }
}

export const createDoctorAccount = async (req, res, next) => {
  try {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : ''
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = req.body?.password
    const doctorId = typeof req.body?.doctorId === 'string' ? req.body.doctorId.trim() : ''

    if (
      fullName.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      !doctorId
    ) {
      return res.status(400).json({
        message: 'Provide name, valid email, password of at least 8 characters, and doctorId.',
      })
    }

    const [profile, existingEmail, existingProfile] = await Promise.all([
      Doctor.findById(doctorId).lean(),
      DoctorAccount.findOne({ email }).lean(),
      DoctorAccount.findOne({ doctorId }).lean(),
    ])

    if (!profile) return res.status(404).json({ message: 'Doctor profile not found.' })
    if (existingEmail) return res.status(409).json({ message: 'A Doctor account already uses this email.' })
    if (existingProfile) return res.status(409).json({ message: 'This Doctor profile already has a login account.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const account = await DoctorAccount.create({
      fullName,
      email,
      passwordHash,
      doctorId,
      isActive: true,
    })
    res.status(201).json({
      _id: account._id,
      fullName: account.fullName,
      email: account.email,
      doctorId: account.doctorId,
      isActive: account.isActive,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate Doctor account details.' })
    }
    next(error)
  }
}

export const updateDoctorAccount = async (req, res, next) => {
  try {
    const updates = {}
    if (typeof req.body?.fullName === 'string') updates.fullName = req.body.fullName.trim()
    if (typeof req.body?.isActive === 'boolean') updates.isActive = req.body.isActive
    if (typeof req.body?.password === 'string' && req.body.password.length > 0) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: 'Password must contain at least 8 characters.' })
      }
      updates.passwordHash = await bcrypt.hash(req.body.password, 12)
    }

    const account = await DoctorAccount.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select('_id fullName email doctorId isActive')
      .lean()

    if (!account) return res.status(404).json({ message: 'Doctor account not found.' })
    res.json(account)
  } catch (error) {
    next(error)
  }
}

export const deleteDoctorAccount = async (req, res, next) => {
  try {
    const account = await DoctorAccount.findByIdAndDelete(req.params.id).lean()
    if (!account) return res.status(404).json({ message: 'Doctor account not found.' })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
