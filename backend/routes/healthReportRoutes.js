import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import {
  downloadHealthReport,
  getDoctorPatientReports,
  getMyHealthReports,
  uploadHealthReport,
} from '../controllers/healthReportController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const uploadDirectory = path.resolve(process.cwd(), 'uploads', 'reports')
fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    callback(null, `${crypto.randomUUID()}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(new Error('Only PDF, JPG and PNG files are allowed.'))
      return
    }
    callback(null, true)
  },
})

const router = Router()

router.use(requireAuth)
router.post('/', requireRole('Patient'), upload.single('file'), uploadHealthReport)
router.get('/mine', requireRole('Patient'), getMyHealthReports)
router.get('/patient/:patientId', requireRole('Doctor'), getDoctorPatientReports)
router.get('/:id/download', downloadHealthReport)

export default router
