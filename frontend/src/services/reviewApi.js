import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

const reviewClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const fetchReviews = async (signal) => {
  const { data } = await reviewClient.get('/api/reviews', { signal })
  return data
}

export const createReview = async (review) => {
  const { data } = await reviewClient.post('/api/reviews', review)
  return data
}

export const deleteReview = async (reviewId) => {
  await reviewClient.delete(`/api/reviews/${encodeURIComponent(reviewId)}`)
}
