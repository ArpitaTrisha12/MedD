import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message)
  res.status(500).json({ message: 'An unexpected server error occurred.' })
})

export default app
