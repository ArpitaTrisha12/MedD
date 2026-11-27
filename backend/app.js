import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import prescriptionRoutes from './routes/prescriptionRoutes.js'
import healthReportRoutes from './routes/healthReportRoutes.js'
import accountRoutes from './routes/accountRoutes.js'
import auditLogRoutes from './routes/auditLogRoutes.js'

const app = express()

app.use(cors({
  origin(origin, callback) {
    const allowedOrigins = new Set([
      process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ])
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('Origin is not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/health-reports', healthReportRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/audit-logs', auditLogRoutes)

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message)
  res.status(500).json({ message: 'An unexpected server error occurred.' })
})

export default app
