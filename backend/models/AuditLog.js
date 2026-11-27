import mongoose from 'mongoose'
import {
  AUDIT_MODULES,
  AUDIT_OPERATION_TYPES,
  AUDIT_USER_ROLES,
} from '../constants/auditLog.js'

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: AUDIT_USER_ROLES,
    },
    relatedRecordId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    module: {
      type: String,
      required: true,
      enum: AUDIT_MODULES,
    },
    operationType: {
      type: String,
      required: true,
      enum: AUDIT_OPERATION_TYPES,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ userRole: 1, operationType: 1, module: 1, createdAt: -1 })

auditLogSchema.pre('save', function preventAuditLogUpdates() {
  if (!this.isNew) {
    throw new Error('Audit records are immutable.')
  }
})

auditLogSchema.pre('deleteOne', { document: true, query: false }, function preventDocumentDelete() {
  throw new Error('Audit records are immutable.')
})

for (const operation of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
]) {
  auditLogSchema.pre(operation, function preventAuditLogMutation() {
    throw new Error('Audit records are immutable.')
  })
}

const AuditLog = mongoose.model('AuditLog', auditLogSchema)

export default AuditLog
