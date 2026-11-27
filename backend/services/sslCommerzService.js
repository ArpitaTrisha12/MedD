const SANDBOX_URL = 'https://sandbox.sslcommerz.com'
const LIVE_URL = 'https://securepay.sslcommerz.com'

export class PaymentGatewayError extends Error {
  constructor(message, statusCode = 502) {
    super(message)
    this.name = 'PaymentGatewayError'
    this.statusCode = statusCode
  }
}

const getGatewayConfig = () => {
  const { SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_MODE } = process.env
  const callbackBaseUrl = process.env.PAYMENT_CALLBACK_BASE_URL?.replace(/\/+$/, '')

  if (!SSLCOMMERZ_STORE_ID || !SSLCOMMERZ_STORE_PASSWORD || !callbackBaseUrl) {
    return null
  }

  let callbackUrl
  try {
    callbackUrl = new URL(callbackBaseUrl)
  } catch {
    throw new PaymentGatewayError('Payment callback URL configuration is invalid.', 503)
  }

  const sandbox = SSLCOMMERZ_MODE !== 'live'
  if (
    callbackUrl.protocol !== 'https:' &&
    !(sandbox && ['localhost', '127.0.0.1'].includes(callbackUrl.hostname))
  ) {
    throw new PaymentGatewayError(
      'Payment callback URL must use HTTPS outside local sandbox development.',
      503,
    )
  }

  return {
    storeId: SSLCOMMERZ_STORE_ID,
    storePassword: SSLCOMMERZ_STORE_PASSWORD,
    baseUrl: sandbox ? SANDBOX_URL : LIVE_URL,
    callbackBaseUrl,
  }
}

const requestJson = async (url, body) => {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch {
    throw new PaymentGatewayError(
      'The payment provider could not be reached. Check the payment history before retrying.',
    )
  }

  if (!response.ok) {
    throw new PaymentGatewayError('The payment provider returned an error.')
  }

  try {
    return await response.json()
  } catch {
    throw new PaymentGatewayError('The payment provider returned an invalid response.')
  }
}

const requestJsonGet = async (url) => {
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new PaymentGatewayError(
      'The payment provider could not be reached. Check the payment history before retrying.',
    )
  }

  if (!response.ok) {
    throw new PaymentGatewayError('The payment provider returned an error.')
  }

  try {
    return await response.json()
  } catch {
    throw new PaymentGatewayError('The payment provider returned an invalid response.')
  }
}

export const isSslCommerzConfigured = () => Boolean(getGatewayConfig())

export const createSslCommerzSession = async ({ payment, patient }) => {
  const config = getGatewayConfig()
  if (!config) {
    throw new PaymentGatewayError('SSLCOMMERZ merchant settings are not configured.', 503)
  }
  if (!patient.phone) {
    throw new PaymentGatewayError(
      'Add a phone number to your profile before starting checkout.',
      400,
    )
  }

  const callbackBase = `${config.callbackBaseUrl}/api/payments/sslcommerz`
  const fields = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: payment.amount.toFixed(2),
    currency: payment.currency,
    tran_id: payment.merchantTransactionId,
    success_url: `${callbackBase}/success`,
    fail_url: `${callbackBase}/fail`,
    cancel_url: `${callbackBase}/cancel`,
    ipn_url: `${callbackBase}/ipn`,
    cus_name: patient.fullName.slice(0, 50),
    cus_email: patient.email.slice(0, 50),
    cus_add1: (patient.address || 'N/A').slice(0, 50),
    cus_city: 'N/A',
    cus_postcode: 'N/A',
    cus_country: 'Bangladesh',
    cus_phone: patient.phone.slice(0, 20),
    shipping_method: 'NO',
    product_name: 'MedD doctor consultation',
    product_category: 'healthcare',
    product_profile: 'non-physical-goods',
  })

  if (payment.method === 'bkash') {
    fields.set('multi_card_name', 'bkash')
  } else if (payment.cardBrand === 'visa') {
    fields.set('multi_card_name', 'visacard')
  } else if (payment.cardBrand === 'mastercard') {
    fields.set('multi_card_name', 'mastercard')
  }

  const data = await requestJson(`${config.baseUrl}/gwprocess/v4/api.php`, fields)
  if (
    data.status !== 'SUCCESS' ||
    typeof data.GatewayPageURL !== 'string' ||
    typeof data.sessionkey !== 'string' ||
    data.sessionkey.length === 0 ||
    data.sessionkey.length > 50
  ) {
    return { success: false }
  }

  let checkoutUrl
  try {
    checkoutUrl = new URL(data.GatewayPageURL)
  } catch {
    throw new PaymentGatewayError('The payment provider returned an invalid checkout URL.')
  }

  const allowedHosts = new Set(['sandbox.sslcommerz.com', 'securepay.sslcommerz.com'])
  if (checkoutUrl.protocol !== 'https:' || !allowedHosts.has(checkoutUrl.hostname)) {
    throw new PaymentGatewayError('The payment provider returned an untrusted checkout URL.')
  }

  return {
    success: true,
    checkoutUrl: checkoutUrl.toString(),
    sessionKey: data.sessionkey,
  }
}

export const querySslCommerzSession = async (sessionKey) => {
  const config = getGatewayConfig()
  if (!config) {
    throw new PaymentGatewayError('SSLCOMMERZ merchant settings are not configured.', 503)
  }

  const params = new URLSearchParams({
    sessionkey: sessionKey,
    store_id: config.storeId,
    store_passwd: config.storePassword,
    format: 'json',
  })
  return requestJsonGet(
    `${config.baseUrl}/validator/api/merchantTransIDvalidationAPI.php?${params.toString()}`,
  )
}

export const validateSslCommerzTransaction = async (validationId) => {
  const config = getGatewayConfig()
  if (!config) {
    throw new PaymentGatewayError('SSLCOMMERZ merchant settings are not configured.', 503)
  }

  const params = new URLSearchParams({
    val_id: validationId,
    store_id: config.storeId,
    store_passwd: config.storePassword,
    format: 'json',
  })
  return requestJsonGet(
    `${config.baseUrl}/validator/api/validationserverAPI.php?${params.toString()}`,
  )
}
