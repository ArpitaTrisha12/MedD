import mongoose from 'mongoose'

const healthReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    reportType: {
      type: String,
      required: true,
      enum: ['Blood Test', 'X-ray', 'MRI', 'ECG', 'Ultrasound', 'Other'],
    },
    title: { type: String, required: true, trim: true },
    reportDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

healthReportSchema.index({ patient: 1, createdAt: -1 })

const HealthReport = mongoose.model('HealthReport', healthReportSchema)

export default HealthReport
