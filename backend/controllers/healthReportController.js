import path from 'node:path'
import fs from 'node:fs'
import HealthReport from '../models/HealthReport.js'
import Appointment from '../models/Appointment.js'
import { recordAudit } from '../services/auditLogService.js'

const uploadDirectory = path.resolve(process.cwd(), 'uploads', 'reports')

export const uploadHealthReport = async (req, res, next) => {
  let reportSaved = false
  try {
    const { reportType, title, reportDate } = req.body ?? {}
    if (
      !req.file ||
      !['Blood Test', 'X-ray', 'MRI', 'ECG', 'Ultrasound', 'Other'].includes(reportType) ||
      typeof title !== 'string' ||
      title.trim().length < 2 ||
      typeof reportDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)
    ) {
      if (req.file) fs.unlink(req.file.path, () => {})
      return res.status(400).json({
        message: 'Provide report type, title, report date and one PDF/JPG/PNG file.',
      })
    }

    const report = await HealthReport.create({
      patient: req.user._id,
      reportType,
      title: title.trim(),
      reportDate,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    })
    reportSaved = true
    await recordAudit({
      action: 'Health report uploaded',
      userId: req.user._id,
      userRole: 'Patient',
      relatedRecordId: report._id,
      module: 'healthReports',
      operationType: 'CREATE',
    })
    res.status(201).json(report)
  } catch (error) {
    if (req.file && !reportSaved) fs.unlink(req.file.path, () => {})
    next(error)
  }
}

export const getMyHealthReports = async (req, res, next) => {
  try {
    const reports = await HealthReport.find({ patient: req.user._id })
      .sort({ reportDate: -1, createdAt: -1 })
      .lean()
    res.json(reports)
  } catch (error) {
    next(error)
  }
}

export const getDoctorPatientReports = async (req, res, next) => {
  try {
    if (!req.user.doctorId) {
      return res.status(403).json({ message: 'This doctor account is not linked to a doctor profile.' })
    }
    const relationship = await Appointment.findOne({
      patient: req.params.patientId,
      doctor: req.user.doctorId,
      status: { $ne: 'Cancelled' },
    }).lean()
    if (!relationship) {
      return res.status(403).json({
        message: 'You can only access reports for a patient with an existing appointment.',
      })
    }
    const reports = await HealthReport.find({ patient: req.params.patientId })
      .sort({ reportDate: -1, createdAt: -1 })
      .lean()
    res.json(reports)
  } catch (error) {
    next(error)
  }
}

export const downloadHealthReport = async (req, res, next) => {
  try {
    const report = await HealthReport.findById(req.params.id).lean()
    if (!report) return res.status(404).json({ message: 'Health report not found.' })

    let allowed = req.accountRole === 'Patient' &&
      report.patient.toString() === req.user._id.toString()

    if (!allowed && req.accountRole === 'Doctor' && req.user.doctorId) {
      const relationship = await Appointment.findOne({
        patient: report.patient,
        doctor: req.user.doctorId,
        status: { $ne: 'Cancelled' },
      }).lean()
      allowed = Boolean(relationship)
    }

    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to access this health report.' })
    }

    const filePath = path.resolve(uploadDirectory, report.storedName)
    if (!filePath.startsWith(`${uploadDirectory}${path.sep}`) || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Stored report file not found.' })
    }

    res.setHeader('Content-Type', report.mimeType)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.originalName.replace(/["\\r\\n]/g, '')}"`,
    )
    res.sendFile(filePath)
  } catch (error) {
    next(error)
  }
}
