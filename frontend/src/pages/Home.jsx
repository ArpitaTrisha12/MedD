
import { useState, useEffect } from 'react'
import { assets, doctorImages, specialityData } from '../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'
import useDoctors from '../hooks/useDoctors'
import { createReview, fetchReviews } from '../services/reviewApi'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { doctors, isLoading, error } = useDoctors({ featured: true })

  const [review, setReview] = useState({
    name: user?.name || '',
    email: user?.email || '',
    rating: 5,
    message: ''
  })
  const [reviews, setReviews] = useState([])
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchReviews(controller.signal)
      .then(setReviews)
      .catch(() => setReviews([]))
    return () => controller.abort()
  }, [])

  // About and Contact section scrolling
  useEffect(() => {
    if (
      location.hash === '#more-doctors' ||
      location.hash === '#contact-section'
    ) {
      const timer = setTimeout(() => {
        document.getElementById(
          location.hash.substring(1)
        )?.scrollIntoView({
          behavior: 'smooth',
          block: location.hash === '#contact-section' ? 'end' : 'start'
        })
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [location.pathname, location.hash])

  const handleProtectedNavigation = (path) => {
    navigate(user ? path : '/login')
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'Patient') {
      setReviewMessage('Only Patient accounts can submit reviews.')
      return
    }

    setReviewMessage('')
    try {
      const savedReview = await createReview({
        name: review.name || user.name,
        rating: review.rating,
        message: review.message,
      })
      setReviews((current) => [savedReview, ...current])
      setReview((current) => ({ ...current, message: '', rating: 5 }))
      setReviewMessage('Your review was saved successfully.')
    } catch (requestError) {
      setReviewMessage(
        requestError.response?.data?.message ||
        'Unable to save your review.',
      )
    }
  }

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-left">
          <h1>
            Find the Best Doctors
            <br />
            Across Bangladesh
          </h1>

          <div className="hero-description">
            <img src={assets.group_profiles} alt="Our medical team" />

            <p>
              Find qualified doctors across Bangladesh and book appointments
              according to your needs and preferred schedule.
            </p>
          </div>

          <button
            className="hero-button"
            onClick={() => handleProtectedNavigation('/doctors')}
          >
            Find Doctors
            <img src={assets.arrow_icon} alt="" />
          </button>
        </div>

        <div className="hero-right">
          <img src={assets.header_img} alt="MedD medical team" />
        </div>

      </section>

      {/* Speciality Section */}
      <section className="speciality">

        <h2>Find by Speciality</h2>

        <p>
          Browse doctors based on your health needs and find the right
          specialist for your care.
        </p>

        <div className="speciality-list">
          {specialityData.map((item, index) => (
            <div
              className="speciality-item"
              key={index}
              onClick={() =>
                handleProtectedNavigation(
                  `/doctors?speciality=${encodeURIComponent(item.speciality)}`
                )
              }
            >
              <img src={item.image} alt={item.speciality} />
              <p>{item.speciality}</p>
            </div>
          ))}
        </div>

      </section>

      {/* Top Doctors Section */}
      <section className="top-doctors" id="more-doctors">

        <div className="section-heading">
          <h2>Top Doctors to Book</h2>
        </div>

        <div className="top-doctors-grid">

          {isLoading && <p>Loading doctors...</p>}

          {error && <p role="alert">{error}</p>}

          {!isLoading && !error && doctors.slice(0, 5).map((doctor) => (
            <div
              className="top-doctor-card"
              key={doctor._id}
              onClick={() =>
                handleProtectedNavigation(`/appointment/${doctor._id}`)
              }
            >
              <img
                className="top-doctor-image"
                src={doctorImages[doctor.image] || doctor.image}
                alt={doctor.name}
              />

              <div className="top-doctor-info">

                <p className="doctor-status">
                  <span></span>
                  View Profile
                </p>

                <h3>{doctor.name}</h3>

                <p className="doctor-speciality">
                  {doctor.speciality}
                </p>

                <p className="doctor-division">
                  {doctor.division} Division
                </p>

              </div>
            </div>
          ))}

        </div>

        <button
          className="more-doctors-button"
          onClick={() => handleProtectedNavigation('/doctors')}
        >
          More Doctors
        </button>

      </section>

      {/* Doctor Image + Patient Review Section */}
      <section className="appointment-review-layout">

        <div className="review-doctor-image">
          <img
            src={assets.appointment_img}
            alt="MedD Doctor"
          />
        </div>

        <div className="patient-review">

          <div className="section-heading">
            <h2>Share Your Experience</h2>

            <p>
              Your feedback helps us improve the MedD healthcare experience.
            </p>
          </div>

          <form
            className="review-form"
            onSubmit={handleReviewSubmit}
          >

            <div className="review-input-row">

              <div className="review-field">
                <label htmlFor="review-name">
                  Your Name
                </label>

                <input
                  id="review-name"
                  type="text"
                  placeholder="Enter your name"
                  value={review.name || user?.name || ''}
                  onChange={(e) =>
                    setReview({
                      ...review,
                      name: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="review-field">
                <label htmlFor="review-email">
                  Email Address
                </label>

                <input
                  id="review-email"
                  type="email"
                  placeholder="Enter your email"
                  value={review.email || user?.email || ''}
                  readOnly
                  onChange={(e) =>
                    setReview({
                      ...review,
                      email: e.target.value
                    })
                  }
                  required
                />
              </div>

            </div>

            <div className="review-field">

              <label>Your Rating</label>

              <div className="rating-select">

                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={
                      star <= review.rating
                        ? 'star active'
                        : 'star'
                    }
                    onClick={() =>
                      setReview({
                        ...review,
                        rating: star
                      })
                    }
                    aria-label={`Rate ${star} out of 5`}
                  >
                    ★
                  </button>
                ))}

                <span>
                  {review.rating} out of 5
                </span>

              </div>

            </div>

            <div className="review-field">

              <label htmlFor="review-message">
                Your Review
              </label>

              <textarea
                id="review-message"
                rows="5"
                placeholder="Write your experience with MedD..."
                value={review.message}
                onChange={(e) =>
                  setReview({
                    ...review,
                    message: e.target.value
                  })
                }
                required
              />

            </div>

            <button
              className="review-submit"
              type="submit"
            >
              Submit Review
            </button>

            <p className="review-note">
              Reviews are saved securely to MedD.
            </p>
            {reviewMessage && (
              <p className="review-status" role="status">
                {reviewMessage}
              </p>
            )}

          </form>

          {reviews.length > 0 && (
            <div className="saved-reviews">
              <h3>Recent Patient Reviews</h3>
              {reviews.slice(0, 3).map((item) => (
                <article className="saved-review-card" key={item._id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                  </div>
                  <p>{item.message}</p>
                  {item.createdAt && (
                    <time dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </time>
                  )}
                </article>
              ))}
            </div>
          )}

        </div>

      </section>

      {/* Footer */}
      <footer className="home-footer" id="contact-section">

        <div className="footer-main">

          <div className="footer-about">
            <img src={assets.logo} alt="MedD Logo" />

            <p>
              MedD helps patients find suitable doctors and book appointments
              conveniently across Bangladesh.
            </p>
          </div>

          <div className="footer-links">

            <h3>COMPANY</h3>

            <button onClick={() => navigate('/')}>
              Home
            </button>

            <button onClick={() => navigate('/#more-doctors')}>
              About Us
            </button>

            <button onClick={() => navigate('/#contact-section')}>
              Contact
            </button>

          </div>

          <div className="footer-contact">

            <h3>GET IN TOUCH</h3>

            <p>Email: medd129@gmail.com</p>
            <p>Location: Bangladesh</p>

          </div>

        </div>

        <div className="footer-bottom">
          <p>
            Copyright © 2026 MedD. All Rights Reserved.
          </p>
        </div>

      </footer>

    </div>
  )
}

export default Home
