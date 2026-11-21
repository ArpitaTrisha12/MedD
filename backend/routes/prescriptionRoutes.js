import { Router } from 'express'
import {
  createPrescription,
  downloadPrescriptionPdf,
  getDoctorPrescriptions,
  getMyPrescriptions,
} from '../controllers/prescriptionController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)
router.post('/', requireRole('Doctor'), createPrescription)
router.get('/mine', requireRole('Patient'), getMyPrescriptions)
router.get('/doctor', requireRole('Doctor'), getDoctorPrescriptions)
router.get('/:id/pdf', downloadPrescriptionPdf)

export default router
