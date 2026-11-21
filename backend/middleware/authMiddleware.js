import jwt from 'jsonwebtoken'
import User from '../models/User.js'
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

    const user = await User.findById(payload.sub)
      .select('_id fullName email role isActive')
      .lean()

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Authentication is required.' })
    }

    req.user = user
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

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You are not allowed to perform this action.' })
  }

  next()
}
