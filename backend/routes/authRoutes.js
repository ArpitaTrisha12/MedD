import { Router } from 'express'
import {
  getCurrentUser,
  login,
  logout,
  registerPatient,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', registerPatient)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', requireAuth, getCurrentUser)

export default router
