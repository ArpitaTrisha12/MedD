import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authCookieName, getJwtSecret } from '../config/auth.js'

const sessionDurationMs = 8 * 60 * 60 * 1000
const allowedRoles = ['Patient', 'Doctor', 'Admin']

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: sessionDurationMs,
})

const toPublicUser = (user) => ({
  id: user._id.toString(),
  name: user.fullName,
  email: user.email,
  role: user.role,
})

const setSessionCookie = (res, user) => {
  const token = jwt.sign(
    { sub: user._id.toString() },
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
    const user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: 'Patient',
    })

    res.status(201).json({ user: toPublicUser(user) })
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
    !allowedRoles.includes(role)
  ) {
    return res.status(400).json({ message: 'Provide a valid email, password, and account type.' })
  }

  try {
    const user = await User.findOne({ email: normalizedEmail, role })
      .select('+passwordHash')

    const passwordMatches = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false

    if (!user || !user.isActive || !passwordMatches) {
      return res.status(401).json({ message: 'Incorrect email, password or account type.' })
    }

    setSessionCookie(res, user)
    res.json({ user: toPublicUser(user) })
  } catch (error) {
    next(error)
  }
}

export const logout = (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = cookieOptions()
  res.clearCookie(authCookieName, clearOptions)
  res.status(204).end()
}

export const getCurrentUser = (req, res) => {
  res.json({ user: toPublicUser(req.user) })
}
