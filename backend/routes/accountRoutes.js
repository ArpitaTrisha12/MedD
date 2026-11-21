import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'
import {
  createDoctorAccount,
  deleteDoctorAccount,
  listDoctorAccounts,
  updateDoctorAccount,
} from '../controllers/accountController.js'

const router = Router()

router.use(requireAuth, requireRole('Admin'))
router.get('/doctoraccounts', listDoctorAccounts)
router.post('/doctoraccounts', createDoctorAccount)
router.put('/doctoraccounts/:id', updateDoctorAccount)
router.delete('/doctoraccounts/:id', deleteDoctorAccount)

export default router
