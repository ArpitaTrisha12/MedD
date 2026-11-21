import { Router } from 'express'
import {
  createAppointment,
  getAvailability,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from '../controllers/appointmentController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)
router.get('/availability/:doctorId', getAvailability)
router.get('/mine', requireRole('Patient'), getMyAppointments)
router.post('/', requireRole('Patient'), createAppointment)
router.patch('/:id/reschedule', requireRole('Patient'), rescheduleAppointment)
router.delete('/:id', requireRole('Patient'), cancelAppointment)

export default router
