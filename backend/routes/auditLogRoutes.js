import { Router } from 'express'
import { getAuditHistory } from '../controllers/auditLogController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('Admin'), getAuditHistory)

export default router
