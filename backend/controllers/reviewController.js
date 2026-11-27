import Review from '../models/Review.js'
import { recordAudit } from '../services/auditLogService.js'

export const getReviews = async (_req, res, next) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .select('_id name rating message createdAt')
      .lean()
    res.json(reviews)
  } catch (error) {
    next(error)
  }
}

export const createReview = async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    const rating = Number(req.body?.rating)

    if (name.length < 2 || message.length < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Provide a name, a 1-to-5 rating, and a review message.',
      })
    }

    const review = await Review.create({
      patient: req.user._id,
      name,
      email: req.user.email,
      rating,
      message,
    })

    await recordAudit({
      action: 'Patient review submitted',
      userId: req.user._id,
      userRole: 'Patient',
      relatedRecordId: review._id,
      module: 'reviews',
      operationType: 'CREATE',
    })

    res.status(201).json({
      _id: review._id,
      name: review.name,
      rating: review.rating,
      message: review.message,
      createdAt: review.createdAt,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id).lean()
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' })
    }
    await recordAudit({
      action: 'Patient review deleted',
      userId: req.user._id,
      userRole: 'Admin',
      relatedRecordId: review._id,
      module: 'reviews',
      operationType: 'DELETE',
    })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
