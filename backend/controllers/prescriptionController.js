import PDFDocument from 'pdfkit'
import Prescription from '../models/Prescription.js'
import Appointment from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'
import Patient from '../models/Patient.js'
import { recordAudit } from '../services/auditLogService.js'

const parseDate = (value) => (
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
)

export const createPrescription = async (req, res, next) => {
  try {
    if (!req.user.doctorId) {
      return res.status(403).json({ message: 'This doctor account is not linked to a doctor profile.' })
    }

    const { patientId, diagnosis, medicines, prescriptionDate, notes } = req.body ?? {}
    if (
      !parseDate(prescriptionDate) ||
      typeof diagnosis !== 'string' ||
      diagnosis.trim().length < 2 ||
      !Array.isArray(medicines) ||
      medicines.length === 0
    ) {
      return res.status(400).json({
        message: 'Provide a patient, diagnosis, prescription date and at least one medicine.',
      })
    }

    const normalizedMedicines = medicines.map((medicine) => ({
      name: typeof medicine.name === 'string' ? medicine.name.trim() : '',
      dosage: typeof medicine.dosage === 'string' ? medicine.dosage.trim() : '',
      duration: typeof medicine.duration === 'string' ? medicine.duration.trim() : '',
      instructions: typeof medicine.instructions === 'string' ? medicine.instructions.trim() : '',
    }))

    if (normalizedMedicines.some((medicine) => !medicine.name || !medicine.dosage || !medicine.duration)) {
      return res.status(400).json({
        message: 'Every medicine requires a name, dosage and duration.',
      })
    }

    const [patient, doctor] = await Promise.all([
      Patient.findOne({ _id: patientId, isActive: true }).lean(),
      Doctor.findById(req.user.doctorId).lean(),
    ])
    if (!patient) return res.status(404).json({ message: 'Patient not found.' })
    if (!doctor) return res.status(404).json({ message: 'Linked doctor profile not found.' })

    const relationship = await Appointment.findOne({
      patient: patient._id,
      doctor: req.user.doctorId,
      status: { $ne: 'Cancelled' },
    }).lean()
    if (!relationship) {
      return res.status(403).json({
        message: 'Prescriptions can only be issued to a patient with an existing appointment.',
      })
    }

    const prescription = await Prescription.create({
      patient: patient._id,
      doctor: req.user.doctorId,
      doctorUser: req.user._id,
      patientName: patient.fullName,
      patientEmail: patient.email,
      doctorName: doctor.name,
      diagnosis: diagnosis.trim(),
      medicines: normalizedMedicines,
      prescriptionDate,
      notes: typeof notes === 'string' ? notes.trim() : '',
    })

    await recordAudit({
      action: 'Prescription created',
      userId: req.user._id,
      userRole: 'Doctor',
      relatedRecordId: prescription._id,
      module: 'prescriptions',
      operationType: 'CREATE',
    })

    res.status(201).json(prescription)
  } catch (error) {
    next(error)
  }
}

export const getMyPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .sort({ prescriptionDate: -1, createdAt: -1 })
      .lean()
    res.json(prescriptions)
  } catch (error) {
    next(error)
  }
}

export const getDoctorPrescriptions = async (req, res, next) => {
  try {
    if (!req.user.doctorId) {
      return res.status(403).json({ message: 'This doctor account is not linked to a doctor profile.' })
    }
    const prescriptions = await Prescription.find({
      doctor: req.user.doctorId,
      doctorUser: req.user._id,
    })
      .sort({ prescriptionDate: -1, createdAt: -1 })
      .lean()
    res.json(prescriptions)
  } catch (error) {
    next(error)
  }
}

export const downloadPrescriptionPdf = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id).lean()
    if (!prescription) return res.status(404).json({ message: 'Prescription not found.' })

    const isOwner = prescription.patient.toString() === req.user._id.toString()
    const isIssuingDoctor =
      req.accountRole === 'Doctor' &&
      prescription.doctorUser.toString() === req.user._id.toString()
    if (!isOwner && !isIssuingDoctor) {
      return res.status(403).json({ message: 'You are not allowed to access this prescription.' })
    }

    const pdf = new PDFDocument({ margin: 50, size: 'A4' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="prescription-${prescription._id}.pdf"`,
    )
    pdf.pipe(res)

    pdf.fontSize(20).text('MedD Digital Prescription', { align: 'center' })
    pdf.moveDown()
    pdf.fontSize(12).text(`Prescription date: ${prescription.prescriptionDate}`)
    pdf.text(`Doctor: ${prescription.doctorName}`)
    pdf.text(`Patient: ${prescription.patientName}`)
    pdf.text(`Patient email: ${prescription.patientEmail}`)
    pdf.moveDown()
    pdf.fontSize(14).text('Diagnosis')
    pdf.fontSize(12).text(prescription.diagnosis)
    pdf.moveDown()
    pdf.fontSize(14).text('Medicines')
    prescription.medicines.forEach((medicine, index) => {
      pdf.moveDown(0.3)
      pdf.fontSize(12).text(`${index + 1}. ${medicine.name}`)
      pdf.text(`   Dosage: ${medicine.dosage}`)
      pdf.text(`   Duration: ${medicine.duration}`)
      if (medicine.instructions) pdf.text(`   Instructions: ${medicine.instructions}`)
    })
    if (prescription.notes) {
      pdf.moveDown()
      pdf.fontSize(14).text('Additional instructions')
      pdf.fontSize(12).text(prescription.notes)
    }
    pdf.moveDown(2)
    pdf.fontSize(10).text('Generated by MedD', { align: 'center' })
    pdf.end()
  } catch (error) {
    next(error)
  }
}
