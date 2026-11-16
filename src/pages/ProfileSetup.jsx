
import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import './ProfileSetup.css'

const ProfileSetup = () => {
  const navigate = useNavigate()

  let user = null

  try {
    user = JSON.parse(localStorage.getItem('meddUser') || 'null')
  } catch (error) {
    localStorage.removeItem('meddUser')
  }

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    qualification: '',
    speciality: '',
    experience: '',
    fee: ''
  })

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const allProfiles = JSON.parse(
      localStorage.getItem('meddProfiles') || '{}'
    )

    allProfiles[user.email] = {
      ...formData,
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString()
    }

    localStorage.setItem('meddProfiles', JSON.stringify(allProfiles))

    alert('Profile created successfully!')
    navigate('/dashboard')
  }

  return (
    <div className="profile-setup-container">
      <form className="profile-setup-form" onSubmit={handleSubmit}>
        <h2>Create Your Profile</h2>
        <p>Complete your information to continue to MedD.</p>

        <div className="profile-role">
          Account Type: <strong>{user.role}</strong>
        </div>

        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input type="email" value={user.email} readOnly />

        <label>Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        {user.role === 'Patient' && (
          <>
            <label>Age</label>
            <input
              type="number"
              name="age"
              min="1"
              value={formData.age}
              onChange={handleChange}
              required
            />

            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </>
        )}

        {user.role === 'Doctor' && (
          <>
            <label>Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              required
            />

            <label>Speciality</label>
            <select
              name="speciality"
              value={formData.speciality}
              onChange={handleChange}
              required
            >
              <option value="">Select Speciality</option>
              <option value="General physician">General physician</option>
              <option value="Gynecologist">Gynecologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Pediatricians">Pediatricians</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Gastroenterologist">Gastroenterologist</option>
            </select>

            <label>Years of Experience</label>
            <input
              type="number"
              name="experience"
              min="0"
              value={formData.experience}
              onChange={handleChange}
              required
            />

            <label>Consultation Fee</label>
            <input
              type="number"
              name="fee"
              min="0"
              value={formData.fee}
              onChange={handleChange}
              required
            />

            <label>Clinic / Chamber Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </>
        )}

        {user.role === 'Admin' && (
          <>
            <label>Admin Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </>
        )}

        <button type="submit">Save Profile</button>
      </form>
    </div>
  )
}

export default ProfileSetup
