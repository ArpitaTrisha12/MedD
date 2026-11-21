
import { useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, status, logout } = useAuth()

  const [showMenu, setShowMenu] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const linkClass = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link'

  // About navigation
  const handleAboutClick = (e) => {
    e.preventDefault()
    setShowMenu(false)

    if (location.pathname === '/') {
      document.getElementById('more-doctors')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

      window.history.replaceState(null, '', '/#more-doctors')
    } else {
      navigate('/#more-doctors')
    }
  }

  // Contact navigation
  const handleContactClick = (e) => {
    e.preventDefault()
    setShowMenu(false)

    if (location.pathname === '/') {
      document.getElementById('contact-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      })

      window.history.replaceState(null, '', '/#contact-section')
    } else {
      navigate('/#contact-section')
    }
  }

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
          <NavLink to="/" end className={linkClass}>
            HOME
          </NavLink>
        </li>

        <li>
          <NavLink to="/doctors" className={linkClass}>
            ALL DOCTORS
          </NavLink>
        </li>

        <li>
          <a
            href="/#more-doctors"
            className={
              location.pathname === '/' && location.hash === '#more-doctors'
                ? 'nav-link active'
                : 'nav-link'
            }
            onClick={handleAboutClick}
          >
            ABOUT
          </a>
        </li>

        <li>
          <a
            href="/#contact-section"
            className={
              location.pathname === '/' && location.hash === '#contact-section'
                ? 'nav-link active'
                : 'nav-link'
            }
            onClick={handleContactClick}
          >
            CONTACT
          </a>
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
            src={user?.image || assets.profile_pic}
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
                    navigate('/dashboard')
                    setShowMenu(false)
                  }}>
                    Doctor Management
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

              <button
                className="logout-option"
                onClick={handleLogout}
              >
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
