import AuditLog from '../models/AuditLog.js'

export const recordAudit = async ({
  action,
  userId,
  userRole,
  relatedRecordId,
  module,
  operationType,
}) => AuditLog.create({
  action,
  userId,
  userRole,
  relatedRecordId: String(relatedRecordId),
  module,
  operationType,
})
