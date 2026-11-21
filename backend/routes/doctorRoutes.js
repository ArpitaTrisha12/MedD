import { Router } from 'express'
import {
  getDoctorById,
  getDoctors,
  getFeaturedDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/featured', getFeaturedDoctors)
router.get('/', requireAuth, getDoctors)
router.get('/:id', requireAuth, getDoctorById)
router.post('/', requireAuth, requireRole('Admin'), createDoctor)
router.put('/:id', requireAuth, requireRole('Admin', 'Doctor'), updateDoctor)
router.delete('/:id', requireAuth, requireRole('Admin'), deleteDoctor)

export default router
