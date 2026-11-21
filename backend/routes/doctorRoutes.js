import { Router } from 'express'
import {
  getDoctorById,
  getDoctors,
  getFeaturedDoctors,
} from '../controllers/doctorController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/featured', getFeaturedDoctors)
router.get('/', requireAuth, getDoctors)
router.get('/:id', requireAuth, getDoctorById)

export default router
