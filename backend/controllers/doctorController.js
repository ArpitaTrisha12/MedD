import Doctor from '../models/Doctor.js'

export const getDoctors = async (_req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ order: 1 }).lean()
    res.json(doctors)
  } catch (error) {
    next(error)
  }
}
