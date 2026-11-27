import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPayment, initiatePayment, resolvePayment } from '../services/paymentApi'
import './PaymentResult.css'

const statusClass = (status) => status.toLowerCase()

const PaymentResult = () => {
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const [result, setResult] = useState({
    paymentId: null,
    payment: null,
    loading: false,
    error: '',
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!paymentId) {
      return undefined
    }

    const controller = new AbortController()
    fetchPayment(paymentId, controller.signal)
      .then((payment) => {
        setResult({ paymentId, payment, loading: false, error: '' })
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            paymentId,
            payment: null,
            loading: false,
            error: requestError.response?.data?.message ||
              'Unable to verify this payment status.',
          })
        }
      })

    return () => controller.abort()
  }, [paymentId])

  const currentResult = !paymentId
    ? {
      payment: null,
      loading: false,
      error: 'Payment reference is missing.',
    }
    : result.paymentId === paymentId
    ? result
    : {
      payment: null,
      loading: Boolean(paymentId),
      error: paymentId ? '' : 'Payment reference is missing.',
    }

  const handleCheckStatus = async () => {
    setActionError('')
    setActionLoading(true)
    try {
      const updated = await resolvePayment(paymentId)
      setResult((current) => ({
        ...current,
        payment: current.payment ? { ...current.payment, status: updated.status } : null,
      }))
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to verify payment status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetry = async () => {
    const payment = currentResult.payment
    if (!payment || payment.method === 'nagad') {
      setActionError('Nagad checkout is unavailable until its official integration is configured.')
      return
    }
    setActionError('')
    setActionLoading(true)
    try {
      const appointmentId = typeof payment.appointment === 'object'
        ? payment.appointment?._id
        : payment.appointment
      const checkout = await initiatePayment({
        appointmentId,
        method: payment.method,
        cardBrand: payment.cardBrand,
      })
      window.location.assign(checkout.checkoutUrl)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to retry payment.')
      setActionLoading(false)
    }
  }

  return (
    <main className="payment-result-page">
      <section className="payment-result-card">
        <span className="payment-result-eyebrow">PAYMENT UPDATE</span>
        <h1>Appointment payment</h1>

        {currentResult.loading && <p role="status">Checking verified payment status...</p>}
        {currentResult.error && (
          <p className="payment-result-error" role="alert">{currentResult.error}</p>
        )}

        {currentResult.payment && (
          <>
            <p className={`payment-result-status ${statusClass(currentResult.payment.status)}`}>
              {currentResult.payment.status}
            </p>
            <p>
              {currentResult.payment.status === 'Paid'
                ? 'Your payment has been verified by the payment provider.'
                : currentResult.payment.status === 'Failed'
                  ? 'The provider confirmed that this attempt failed. You can safely retry the payment.'
                  : currentResult.payment.status === 'Cancelled'
                    ? 'The provider confirmed that this attempt was cancelled. You can safely retry the payment.'
                    : 'The provider has not confirmed this payment yet. Check its status again shortly.'}
            </p>
            <dl>
              <div><dt>Amount</dt><dd>৳{currentResult.payment.amount} {currentResult.payment.currency}</dd></div>
              <div>
                <dt>Transaction reference</dt>
                <dd>{currentResult.payment.merchantTransactionId}</dd>
              </div>
            </dl>
            {currentResult.payment.status === 'Pending' && (
              <button
                type="button"
                className="payment-result-action"
                disabled={actionLoading}
                onClick={handleCheckStatus}
              >
                {actionLoading ? 'Checking...' : 'Check status'}
              </button>
            )}
            {(currentResult.payment.status === 'Failed' ||
              currentResult.payment.status === 'Cancelled') && (
              <button
                type="button"
                className="payment-result-action"
                disabled={actionLoading}
                onClick={handleRetry}
              >
                {actionLoading ? 'Starting checkout...' : 'Retry payment'}
              </button>
            )}
          </>
        )}

        {actionError && <p className="payment-result-error" role="alert">{actionError}</p>}
        <Link to="/my-appointments">View My Appointments</Link>
      </section>
    </main>
  )
}

export default PaymentResult
