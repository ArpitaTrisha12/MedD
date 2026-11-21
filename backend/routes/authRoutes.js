import { Router } from 'express'
import {
  getCurrentUser,
  login,
  logout,
  registerPatient,
  getProfile,
  updateProfile,
  loginPatient,
  loginDoctor,
  loginAdmin,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', registerPatient)
router.post('/login', login)
router.post('/patient/login', loginPatient)
router.post('/doctor/login', loginDoctor)
router.post('/admin/login', loginAdmin)
router.post('/logout', logout)
router.get('/me', requireAuth, getCurrentUser)
router.get('/profile', requireAuth, getProfile)
router.put('/profile', requireAuth, updateProfile)

export default router
