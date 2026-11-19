import cors from 'cors'
import express from 'express'
import doctorRoutes from './routes/doctorRoutes.js'
import healthRoutes from './routes/healthRoutes.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}))
app.use(express.json())
app.use('/api/health', healthRoutes)
app.use('/api/doctors', doctorRoutes)

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message)
  res.status(500).json({ message: 'An unexpected server error occurred.' })
})

export default app
