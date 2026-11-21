import jwt from 'jsonwebtoken'
import Patient from '../models/Patient.js'
import DoctorAccount from '../models/DoctorAccount.js'
import Admin from '../models/Admin.js'
import { authCookieName, getJwtSecret } from '../config/auth.js'

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.[authCookieName]

  if (!token) {
    return res.status(401).json({ message: 'Authentication is required.' })
  }

  try {
    const payload = jwt.verify(token, getJwtSecret())

    if (typeof payload.sub !== 'string') {
      return res.status(401).json({ message: 'Authentication is required.' })
    }

    const role = payload.role
    const Account = role === 'Patient'
      ? Patient
      : role === 'Doctor'
        ? DoctorAccount
        : role === 'Admin'
          ? Admin
          : null
    if (!Account) {
      return res.status(401).json({ message: 'Authentication is required.' })
    }

    const account = await Account.findById(payload.sub).lean()

    if (!account || !account.isActive) {
      return res.status(401).json({ message: 'Authentication is required.' })
    }

    req.user = account
    req.accountRole = role
    req.user.role = role
    next()
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({ message: 'Authentication is required.' })
    }

    next(error)
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication is required.' })
  }

  const accountRole = req.accountRole || req.user.role
  if (!roles.includes(accountRole)) {
    return res.status(403).json({ message: 'You are not allowed to perform this action.' })
  }

  next()
}
