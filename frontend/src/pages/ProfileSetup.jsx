import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { fetchProfile, updateProfile } from '../services/authApi'
import './ProfileSetup.css'

const ProfileSetup = () => {
  const navigate = useNavigate()
  const { user, setAuthenticatedUser } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    qualification: '',
    speciality: '',
    experience: '',
    fee: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    fetchProfile()
      .then((profile) => {
        setFormData({
          fullName: profile.name || '',
          phone: profile.phone || '',
          age: profile.age ?? '',
          gender: profile.gender || '',
          address: profile.address || '',
          qualification: profile.qualification || '',
          speciality: profile.speciality || '',
          experience: profile.experience ?? '',
          fee: profile.fee ?? '',
        })
      })
      .catch((error) => setMessage(error.response?.data?.message || 'Unable to load profile.'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return <Navigate to="/login" replace />

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const updatedUser = await updateProfile(formData)
      setAuthenticatedUser(updatedUser)
      navigate('/my-profile')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="profile-setup-container" role="status">Loading profile...</p>

  return (
    <div className="profile-setup-container">
      <form className="profile-setup-form" onSubmit={handleSubmit}>
        <h2>Edit Your Profile</h2>
        <p>Update your MongoDB-backed MedD profile.</p>
        <div className="profile-role">Account Type: <strong>{user.role}</strong></div>

        <label>Full Name</label>
        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
        <label>Email</label>
        <input type="email" value={user.email} readOnly />
        <label>Phone Number</label>
        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />

        {user.role === 'Patient' && (
          <>
            <label>Age</label>
            <input type="number" name="age" min="1" value={formData.age} onChange={handleChange} required />
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <label>Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required />
          </>
        )}

        {user.role === 'Doctor' && (
          <>
            <label>Qualification</label>
            <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required />
            <label>Speciality</label>
            <select name="speciality" value={formData.speciality} onChange={handleChange} required>
              <option value="">Select Speciality</option>
              <option value="General physician">General physician</option>
              <option value="Gynecologist">Gynecologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Pediatricians">Pediatricians</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Gastroenterologist">Gastroenterologist</option>
            </select>
            <label>Years of Experience</label>
            <input type="number" name="experience" min="0" value={formData.experience} onChange={handleChange} required />
            <label>Consultation Fee</label>
            <input type="number" name="fee" min="0" value={formData.fee} onChange={handleChange} required />
            <label>Clinic / Chamber Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required />
          </>
        )}

        {user.role === 'Admin' && (
          <>
            <label>Admin Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required />
          </>
        )}

        {message && <p className="auth-notice" role="alert">{message}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </form>
    </div>
  )
}

export default ProfileSetup
