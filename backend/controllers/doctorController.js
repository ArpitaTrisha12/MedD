import Doctor from '../models/Doctor.js'

export const getFeaturedDoctors = async (_req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .select('_id name image speciality division')
      .sort({ order: 1 })
      .limit(5)
      .lean()

    res.json(doctors.map((doctor) => ({
      _id: doctor._id,
      name: doctor.name,
      image: doctor.image,
      speciality: doctor.speciality,
      division: doctor.division,
    })))
  } catch (error) {
    next(error)
  }
}

export const getDoctors = async (_req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ order: 1 }).lean()
    res.json(doctors)
  } catch (error) {
    next(error)
  }
}

export const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('_id name image speciality degree experience division about visitingDays visitingHours temporaryUnavailability fees address')
      .lean()

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    res.json(doctor)
  } catch (error) {
    next(error)
  }
}
