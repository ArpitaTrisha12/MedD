import { Router } from 'express'
import {
  createAppointment,
  getAvailability,
  getMyAppointments,
} from '../controllers/appointmentController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)
router.get('/availability/:doctorId', getAvailability)
router.get('/mine', requireRole('Patient'), getMyAppointments)
router.post('/', requireRole('Patient'), createAppointment)

export default router
