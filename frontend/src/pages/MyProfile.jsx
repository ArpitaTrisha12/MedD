import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { fetchProfile } from '../services/authApi'
import './MyProfile.css'

const MyProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchProfile()
      .then(setProfile)
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Unable to load your profile.')
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <p className="my-profile-page" role="status">Loading profile...</p>
  if (error) return <p className="my-profile-page" role="alert">{error}</p>

  const name = profile?.name || user.name || 'User'

  return (
    <div className="my-profile-page">
      <div className="my-profile-card">
        <div className="my-profile-heading">
          {profile?.image || user?.image ? (
            <img
              className="profile-avatar"
              src={profile?.image || user.image}
              alt={`${name} profile`}
            />
          ) : (
            <div className="profile-avatar profile-avatar-fallback">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <h2>{name}</h2>
          <p>{user.role} Account</p>
        </div>

        <div className="profile-details">
          <h3>Personal Information</h3>
          <div className="profile-info-grid">
            <div className="profile-info-item"><span>Full Name</span><strong>{name}</strong></div>
            <div className="profile-info-item"><span>Email Address</span><strong>{user.email}</strong></div>
            <div className="profile-info-item"><span>Phone Number</span><strong>{profile?.phone || 'Not added yet'}</strong></div>
            <div className="profile-info-item"><span>Account Type</span><strong>{user.role}</strong></div>

            {user.role === 'Patient' && (
              <>
                <div className="profile-info-item"><span>Age</span><strong>{profile?.age || 'Not added yet'}</strong></div>
                <div className="profile-info-item"><span>Gender</span><strong>{profile?.gender || 'Not added yet'}</strong></div>
                <div className="profile-info-item full-width"><span>Address</span><strong>{profile?.address || 'Not added yet'}</strong></div>
              </>
            )}

            {user.role === 'Doctor' && (
              <>
                <div className="profile-info-item"><span>Qualification</span><strong>{profile?.qualification || 'Not added yet'}</strong></div>
                <div className="profile-info-item"><span>Speciality</span><strong>{profile?.speciality || 'Not added yet'}</strong></div>
                <div className="profile-info-item"><span>Experience</span><strong>{profile?.experience !== '' ? `${profile.experience} Years` : 'Not added yet'}</strong></div>
                <div className="profile-info-item"><span>Consultation Fee</span><strong>{profile?.fee !== '' ? `৳ ${profile.fee}` : 'Not added yet'}</strong></div>
                <div className="profile-info-item full-width"><span>Clinic / Chamber Address</span><strong>{profile?.address || 'Not added yet'}</strong></div>
              </>
            )}

            {user.role === 'Admin' && (
              <div className="profile-info-item full-width"><span>Admin Address</span><strong>{profile?.address || 'Not added yet'}</strong></div>
            )}
          </div>
        </div>

        <div className="profile-page-actions">
          <button onClick={() => navigate('/profile-setup')}>Edit Profile</button>
          <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  )
}

export default MyProfile
