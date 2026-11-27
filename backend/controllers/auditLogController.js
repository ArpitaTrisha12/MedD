import AuditLog from '../models/AuditLog.js'
import {
  AUDIT_MODULES,
  AUDIT_OPERATION_TYPES,
  AUDIT_USER_ROLES,
} from '../constants/auditLog.js'

const isValidDate = (value) => (
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
)

const nextDate = (value) => {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date
}

export const getAuditHistory = async (req, res, next) => {
  try {
    const {
      from,
      to,
      userRole,
      operationType,
      module,
      page: pageValue = '1',
      limit: limitValue = '50',
    } = req.query

    if (
      (from !== undefined && !isValidDate(from)) ||
      (to !== undefined && !isValidDate(to)) ||
      (from && to && from > to) ||
      (userRole !== undefined && !AUDIT_USER_ROLES.includes(userRole)) ||
      (operationType !== undefined && !AUDIT_OPERATION_TYPES.includes(operationType)) ||
      (module !== undefined && !AUDIT_MODULES.includes(module))
    ) {
      return res.status(400).json({ message: 'One or more audit filters are invalid.' })
    }

    const page = Number(pageValue)
    const limit = Number(limitValue)
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({ message: 'Page or limit is invalid.' })
    }

    const filter = {}
    if (userRole) filter.userRole = userRole
    if (operationType) filter.operationType = operationType
    if (module) filter.module = module
    if (from || to) {
      filter.createdAt = {}
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`)
      if (to) filter.createdAt.$lt = nextDate(to)
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ])

    res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
}
