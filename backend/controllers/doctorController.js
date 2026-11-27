import Doctor from '../models/Doctor.js'
import { recordAudit } from '../services/auditLogService.js'

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

export const createDoctor = async (req, res, next) => {
  try {
    const body = req.body ?? {}
    if (
      typeof body._id !== 'string' ||
      !body._id.trim() ||
      typeof body.name !== 'string' ||
      !body.name.trim() ||
      typeof body.image !== 'string' ||
      !body.image.trim()
    ) {
      return res.status(400).json({
        message: 'Doctor ID, name and image are required.',
      })
    }
    if (
      typeof body.speciality !== 'string' ||
      typeof body.degree !== 'string' ||
      typeof body.experience !== 'string' ||
      typeof body.division !== 'string'
    ) {
      return res.status(400).json({
        message: 'Speciality, degree, experience and division are required.',
      })
    }

    const doctor = await Doctor.create({
      _id: body._id.trim(),
      order: Number(body.order) || 100,
      name: body.name.trim(),
      image: body.image.trim(),
      speciality: body.speciality,
      degree: body.degree,
      experience: body.experience,
      division: body.division,
      about: body.about || '',
      fees: body.fees === '' || body.fees == null
        ? 1000
        : Number(body.fees),
      visitingDays: Array.isArray(body.visitingDays) ? body.visitingDays.map(Number) : [1, 2, 3, 4, 5],
      visitingHours: Array.isArray(body.visitingHours) ? body.visitingHours : [],
      temporaryUnavailability: body.temporaryUnavailability || {},
      address: body.address || { line1: '', line2: '' },
    })

    await recordAudit({
      action: 'Doctor profile created',
      userId: req.user._id,
      userRole: 'Admin',
      relatedRecordId: doctor._id,
      module: 'doctors',
      operationType: 'CREATE',
    })

    res.status(201).json(doctor)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A doctor with this ID already exists.' })
    }
    next(error)
  }
}

export const updateDoctor = async (req, res, next) => {
  try {
    if (
      req.accountRole === 'Doctor' &&
      req.user.doctorId !== req.params.id
    ) {
      return res.status(403).json({
        message: 'Doctors can only update their own availability.',
      })
    }

    const updates = { ...req.body }
    delete updates._id

    if (updates.visitingDays) {
      updates.visitingDays = updates.visitingDays.map(Number)
    }
    if (updates.visitingHours) {
      updates.visitingHours = updates.visitingHours.filter(
        (hours) =>
          hours &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(hours.startTime || '') &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(hours.endTime || ''),
      )
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).lean()

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }
    await recordAudit({
      action: 'Doctor profile updated',
      userId: req.user._id,
      userRole: req.accountRole,
      relatedRecordId: doctor._id,
      module: 'doctors',
      operationType: 'UPDATE',
    })
    res.json(doctor)
  } catch (error) {
    next(error)
  }
}

export const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id).lean()
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }
    await recordAudit({
      action: 'Doctor profile deleted',
      userId: req.user._id,
      userRole: 'Admin',
      relatedRecordId: doctor._id,
      module: 'doctors',
      operationType: 'DELETE',
    })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
