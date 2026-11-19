import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    order: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    division: { type: String, required: true, trim: true },
    about: { type: String, required: true, trim: true },
    fees: { type: Number, required: true, min: 0 },
    address: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, required: true, trim: true },
    },
  },
  { timestamps: true },
)

const Doctor = mongoose.model('Doctor', doctorSchema)

export default Doctor
