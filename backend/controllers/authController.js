import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Patient from '../models/Patient.js'
import DoctorAccount from '../models/DoctorAccount.js'
import Admin from '../models/Admin.js'
import { authCookieName, getJwtSecret } from '../config/auth.js'

const sessionDurationMs = 8 * 60 * 60 * 1000
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: sessionDurationMs,
})

const toPublicUser = (account, role) => ({
  id: account._id.toString(),
  name: account.fullName,
  email: account.email,
  role,
  doctorId: account.doctorId || '',
  phone: account.phone || '',
  age: account.age ?? '',
  gender: account.gender || '',
  address: account.address || '',
  qualification: account.qualification || '',
  speciality: account.speciality || '',
  experience: account.experience ?? '',
  fee: account.fee ?? '',
})

const setSessionCookie = (res, account, role) => {
  const token = jwt.sign(
    { sub: account._id.toString(), role },
    getJwtSecret(),
    { expiresIn: '8h' },
  )

  res.cookie(authCookieName, token, cookieOptions())
}

export const registerPatient = async (req, res, next) => {
  const { fullName, email, password } = req.body ?? {}
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (
    normalizedName.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    return res.status(400).json({
      message: 'Provide a name, valid email, and password with at least 8 characters.',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const patient = await Patient.create({
      fullName: normalizedName,
      email: normalizedEmail,
      passwordHash,
    })

    res.status(201).json({ user: toPublicUser(patient, 'Patient') })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Unable to create an account with those details.' })
    }

    next(error)
  }
}

export const login = async (req, res, next) => {
  const { email, password, role } = req.body ?? {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    typeof password !== 'string' ||
    !['Patient', 'Doctor', 'Admin'].includes(role)
  ) {
    return res.status(400).json({ message: 'Provide a valid email, password, and account type.' })
  }

  try {
    const Account = role === 'Patient'
      ? Patient
      : role === 'Doctor'
        ? DoctorAccount
        : Admin
    const account = await Account.findOne({ email: normalizedEmail }).select('+passwordHash')

    const passwordMatches = account?.passwordHash
      ? await bcrypt.compare(password, account.passwordHash)
      : false

    if (!account || !account.isActive || !passwordMatches) {
      return res.status(401).json({ message: 'Incorrect email, password or account type.' })
    }

    setSessionCookie(res, account, role)
    res.json({ user: toPublicUser(account, role) })
  } catch (error) {
    next(error)
  }
}

export const loginPatient = (req, res, next) => {
  login({ ...req, body: { ...req.body, role: 'Patient' } }, res, next)
}

export const loginDoctor = (req, res, next) => {
  login({ ...req, body: { ...req.body, role: 'Doctor' } }, res, next)
}

export const loginAdmin = (req, res, next) => {
  login({ ...req, body: { ...req.body, role: 'Admin' } }, res, next)
}

export const logout = (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = cookieOptions()
  res.clearCookie(authCookieName, clearOptions)
  res.status(204).end()
}

export const getCurrentUser = (req, res) => {
  res.json({ user: toPublicUser(req.user, req.accountRole) })
}

export const getProfile = (req, res) => {
  res.json({ user: toPublicUser(req.user, req.accountRole) })
}

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'fullName',
      'phone',
      'age',
      'gender',
      'address',
      'qualification',
      'speciality',
      'experience',
      'fee',
    ]
    const updates = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body ?? {}, field)) {
        updates[field] = req.body[field]
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'fullName')) {
      updates.fullName = String(updates.fullName).trim()
      if (updates.fullName.length < 2) {
        return res.status(400).json({ message: 'Full name must contain at least 2 characters.' })
      }
    }

    for (const numericField of ['age', 'experience', 'fee']) {
      if (Object.prototype.hasOwnProperty.call(updates, numericField)) {
        if (updates[numericField] === '' || updates[numericField] === null) {
          updates[numericField] = null
        } else {
          updates[numericField] = Number(updates[numericField])
          if (!Number.isFinite(updates[numericField]) || updates[numericField] < 0) {
            return res.status(400).json({ message: `Invalid ${numericField}.` })
          }
        }
      }
    }

    const Account = req.accountRole === 'Patient'
      ? Patient
      : req.accountRole === 'Doctor'
        ? DoctorAccount
        : Admin
    const account = await Account.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    ).lean()

    res.json({ user: toPublicUser(account, req.accountRole) })
  } catch (error) {
    next(error)
  }
}
