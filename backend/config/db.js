import mongoose from 'mongoose'

const connectDB = async () => {
  const { MONGODB_URI } = process.env

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add your Atlas URI to backend/.env.')
  }

  await mongoose.connect(MONGODB_URI)
  console.log(`MongoDB connected: ${mongoose.connection.host}`)
}

export default connectDB
