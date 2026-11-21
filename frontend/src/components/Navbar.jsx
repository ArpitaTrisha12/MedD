
import { useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, status, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const linkClass = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link'

  const handleLogout = async () => {
    setLogoutError('')

    try {
      await logout()
      setShowMenu(false)
      navigate('/login')
    } catch {
      setLogoutError('Unable to log out. Please try again.')
    }
  }

  return (
    <div className="navbar">

      <img
        className="logo"
        src={assets.logo}
        alt="MedD"
        onClick={() => navigate('/')}
      />

      <ul className="navbar-links">
        <li>
          <NavLink to="/" end className={linkClass}>HOME</NavLink>
        </li>
        <li>
          <NavLink to="/doctors" className={linkClass}>ALL DOCTORS</NavLink>
        </li>
        <li>
          <NavLink to="/about" className={linkClass}>ABOUT</NavLink>
        </li>
        <li>
          <NavLink to="/contact" className={linkClass}>CONTACT</NavLink>
        </li>
      </ul>

      {status === 'loading' ? null : !user ? (
        <button
          className="create-account"
          onClick={() => navigate('/login')}
        >
          Create Account
        </button>
      ) : (
        <div className="navbar-profile">

          <img
            className="navbar-profile-image"
            src={assets.profile_pic}
            alt="Profile"
            onClick={() => setShowMenu(!showMenu)}
          />

          <span
            className="profile-arrow"
            onClick={() => setShowMenu(!showMenu)}
          >
            ▼
          </span>

          {showMenu && (
            <div className="profile-dropdown">

              {logoutError && <p role="alert">{logoutError}</p>}

              <p className="dropdown-user">
                {user.name}
                <small>{user.role}</small>
              </p>

              <hr />

              <button onClick={() => {
                navigate('/dashboard')
                setShowMenu(false)
              }}>
                Dashboard
              </button>

              <button onClick={() => {
                navigate('/my-profile')
                setShowMenu(false)
              }}>
                My Profile
              </button>

              {user.role !== 'Admin' && (
                <button onClick={() => {
                  navigate('/my-appointments')
                  setShowMenu(false)
                }}>
                  My Appointments
                </button>
              )}

              {user.role === 'Admin' && (
                <>
                  <button onClick={() => {
                    navigate('/add-doctor')
                    setShowMenu(false)
                  }}>
                    Add Doctor
                  </button>

                  <button onClick={() => {
                    navigate('/doctors')
                    setShowMenu(false)
                  }}>
                    Doctors List
                  </button>
                </>
              )}

              <hr />

              <button className="logout-option" onClick={handleLogout}>
                Logout
              </button>

            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default Navbar
