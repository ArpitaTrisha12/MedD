import mongoose from 'mongoose'

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, default: '', trim: true },
  },
  { _id: false },
)

const prescriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: String,
      ref: 'Doctor',
      required: true,
    },
    doctorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorAccount',
      required: true,
    },
    patientName: { type: String, required: true, trim: true },
    patientEmail: { type: String, required: true, trim: true, lowercase: true },
    doctorName: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    medicines: {
      type: [medicineSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'At least one medicine is required.',
      },
    },
    prescriptionDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

prescriptionSchema.index({ patient: 1, prescriptionDate: -1 })
prescriptionSchema.index({ doctor: 1, prescriptionDate: -1 })

const Prescription = mongoose.model('Prescription', prescriptionSchema)

export default Prescription
