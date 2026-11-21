
import { useState } from 'react'
import { assets, doctorImages, specialityData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import useDoctors from '../hooks/useDoctors'
import './Home.css'

const REVIEW_EMAIL = 'your-email@example.com' // এখানে তোমার Email বসাবে

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { doctors, isLoading, error } = useDoctors({ featured: true })

  const [review, setReview] = useState({
    name: '',
    email: '',
    rating: 5,
    message: ''
  })

  const handleProtectedNavigation = (path) => {
    navigate(user ? path : '/login')
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()

    const subject = encodeURIComponent('MedD Patient Review')

    const body = encodeURIComponent(
      `Patient Name: ${review.name}
Patient Email: ${review.email}
Rating: ${review.rating}/5

Review:
${review.message}`
    )

    window.location.href = `mailto:${REVIEW_EMAIL}?subject=${subject}&body=${body}`
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
      <section className="top-doctors">

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

        {/* Doctor Image */}
        <div className="review-doctor-image">
          <img
            src={assets.appointment_img}
            alt="MedD Doctor"
          />
        </div>

        {/* Patient Review Section */}
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

            {/* Name and Email */}
            <div className="review-input-row">

              <div className="review-field">
                <label htmlFor="review-name">
                  Your Name
                </label>

                <input
                  id="review-name"
                  type="text"
                  placeholder="Enter your name"
                  value={review.name}
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
                  value={review.email}
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

            {/* Rating */}
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

            {/* Review Message */}
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

            {/* Submit Button */}
            <button
              className="review-submit"
              type="submit"
            >
              Submit Review
            </button>

            <p className="review-note">
              Submitting will open your email application with your review.
            </p>

          </form>

        </div>

      </section>

      {/* Footer */}
      <footer className="home-footer">

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

            <button onClick={() => navigate('/about')}>
              About Us
            </button>

            <button onClick={() => navigate('/contact')}>
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
