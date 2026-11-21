import { Router } from 'express'
import {
  createReview,
  deleteReview,
  getReviews,
} from '../controllers/reviewController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', getReviews)
router.post('/', requireAuth, requireRole('Patient'), createReview)
router.delete('/:id', requireAuth, requireRole('Admin'), deleteReview)

export default router
