import { Router } from 'express'
import {
  getMyPayment,
  getMyPayments,
  handleSslCommerzIpn,
  handleSslCommerzSuccess,
  handleSslCommerzUnsuccessfulReturn,
  initiatePayment,
  resolveMyPayment,
} from '../controllers/paymentController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'
import express from 'express'

const router = Router()

router.use(express.urlencoded({ extended: false, limit: '10kb' }))
router.post('/sslcommerz/success', handleSslCommerzSuccess)
router.post('/sslcommerz/fail', handleSslCommerzUnsuccessfulReturn)
router.post('/sslcommerz/cancel', handleSslCommerzUnsuccessfulReturn)
router.post('/sslcommerz/ipn', handleSslCommerzIpn)

router.post('/checkout', requireAuth, requireRole('Patient'), initiatePayment)
router.get('/mine', requireAuth, requireRole('Patient'), getMyPayments)
router.post('/:id/resolve', requireAuth, requireRole('Patient'), resolveMyPayment)
router.get('/:id', requireAuth, requireRole('Patient'), getMyPayment)

export default router
