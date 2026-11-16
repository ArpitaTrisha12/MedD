import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()

  const [accountType, setAccountType] = useState('Patient')
  const [isLogin, setIsLogin] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const demoAccounts = [
    {
      fullName: 'Demo Patient',
      email: 'patient@medd.com',
      password: '123456',
      role: 'Patient'
    },
    {
      fullName: 'Demo Doctor',
      email: 'doctor@medd.com',
      password: '123456',
      role: 'Doctor'
    },
    {
      fullName: 'Demo Admin',
      email: 'admin@medd.com',
      password: '123456',
      role: 'Admin'
    }
  ]

  const getAccounts = () => {
    let accounts = []

    try {
      accounts = JSON.parse(
        localStorage.getItem('meddAccounts') || '[]'
      )
    } catch {
      accounts = []
    }

    if (!Array.isArray(accounts)) {
      accounts = []
    }

    accounts = accounts.filter(
      user =>
        !demoAccounts.some(
          demo => demo.email === user.email?.toLowerCase()
        )
    )

    accounts = [...accounts, ...demoAccounts]

    localStorage.setItem(
      'meddAccounts',
      JSON.stringify(accounts)
    )

    return accounts
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const accounts = getAccounts()
    const cleanEmail = email.trim().toLowerCase()

    // CREATE ACCOUNT
    if (!isLogin) {
      if (accountType !== 'Patient') {
        alert('Doctor and Admin accounts require Admin approval.')
        return
      }

      const existingUser = accounts.find(
        user => user.email.toLowerCase() === cleanEmail
      )

      if (existingUser) {
        alert('This email already exists. Please login.')
        return
      }

      accounts.push({
        fullName: fullName.trim(),
        email: cleanEmail,
        password,
        role: accountType
      })

      localStorage.setItem(
        'meddAccounts',
        JSON.stringify(accounts)
      )

      alert('Account created successfully! Please login.')

      setIsLogin(true)
      setPassword('')
      return
    }

    // LOGIN
    const matchedUser = accounts.find(
      user =>
        user.email.toLowerCase() === cleanEmail &&
        user.password === password &&
        user.role === accountType
    )

    if (!matchedUser) {
      alert('Incorrect email, password or account type.')
      return
    }

    localStorage.setItem(
      'meddUser',
      JSON.stringify({
        name: matchedUser.fullName,
        email: matchedUser.email,
        role: matchedUser.role
      })
    )

    let profiles = {}

    try {
      profiles = JSON.parse(
        localStorage.getItem('meddProfiles') || '{}'
      )
    } catch {
      profiles = {}
    }

    if (profiles[matchedUser.email]) {
      navigate('/dashboard')
    } else {
      navigate('/profile-setup')
    }
  }

  const selectRole = (role) => {
    setAccountType(role)
  }

  return (
    <div className="medd-auth-page">

      {/* LEFT WELCOME SECTION */}
      <div className="auth-welcome animated-welcome">

        <div className="welcome-content">

          <div className="welcome-logo">

            <div className="medd-logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" />
              </svg>
            </div>

            <span>MedD</span>

            <span className="medd-logo-heartbeat">
              <svg viewBox="0 0 50 24">
                <path d="M1 12h10l5-9 7 18 6-12 4 3h16" />
              </svg>
            </span>

          </div>

          <span className="welcome-tag">
            YOUR HEALTHCARE PARTNER
          </span>

          <h1>
            Your Health,
            <br />
            Our <span>Priority.</span>
          </h1>

          <p>
            Find trusted doctors, book appointments and take
            control of your healthcare journey with MedD.
          </p>

          <div className="welcome-features">

            <div className="welcome-feature">
              <span>✓</span>
              Trusted Healthcare Professionals
            </div>

            <div className="welcome-feature">
              <span>✓</span>
              Easy Online Appointment Booking
            </div>

            <div className="welcome-feature">
              <span>✓</span>
              Manage Your Health in One Place
            </div>

          </div>

          <div className="welcome-decoration decoration-one"></div>
          <div className="welcome-decoration decoration-two"></div>

        </div>

        <div className="welcome-bottom">
          <span>MedD HEALTHCARE</span>
          <span>Care that matters</span>
        </div>

      </div>

      {/* RIGHT FORM SECTION */}
      <div className="auth-form-section">

        <div className="auth-card">

          <div className="auth-mobile-logo">
            MedD
          </div>

          <div className="auth-heading">

            <h2>
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </h2>

            <p>
              {isLogin
                ? 'Login to continue to your MedD account.'
                : 'Join MedD and manage your healthcare easily.'}
            </p>

          </div>

          {/* LOGIN AND REGISTER TABS */}
          <div className="auth-tabs">

            <button
              type="button"
              className={!isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(false)
                setPassword('')
              }}
            >
              Create Account
            </button>

            <button
              type="button"
              className={isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(true)
                setPassword('')
              }}
            >
              Login
            </button>

          </div>

          {/* ACCOUNT TYPE */}
          <div className="role-card-group">

            <button
              type="button"
              className={`role-card ${
                accountType === 'Patient' ? 'selected' : ''
              }`}
              onClick={() => selectRole('Patient')}
            >
              <svg viewBox="0 0 24 24" className="role-icon">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
              </svg>

              <span>Patient</span>
            </button>

            <button
              type="button"
              className={`role-card ${
                accountType === 'Doctor' ? 'selected' : ''
              }`}
              onClick={() => selectRole('Doctor')}
            >
              <svg viewBox="0 0 24 24" className="role-icon">
                <path d="M6 3v5a6 6 0 0 0 12 0V3" />
                <path d="M4 3h4M16 3h4" />
                <path d="M12 14v2a4 4 0 0 0 8 0v-1" />
                <circle cx="20" cy="13" r="1.5" />
                <path d="M12 14a6 6 0 0 1-6-6" />
              </svg>

              <span>Doctor</span>
            </button>

            <button
              type="button"
              className={`role-card ${
                accountType === 'Admin' ? 'selected' : ''
              }`}
              onClick={() => selectRole('Admin')}
            >
              <svg viewBox="0 0 24 24" className="role-icon">
                <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>

              <span>Admin</span>
            </button>

          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="auth-form">

            {!isLogin && (
              <>
                <label className="auth-label">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="auth-input"
                />
              </>
            )}

            <label className="auth-label">
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />

            <label className="auth-label">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />

            <button type="submit" className="auth-submit">
              {isLogin ? 'Login to MedD' : 'Create My Account'}
              <span>→</span>
            </button>

          </form>

          {/* BOTTOM LOGIN LINK */}
          <p className="auth-bottom-text">

            {isLogin
              ? "Don't have an account?"
              : 'Already have an account?'}

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setPassword('')
              }}
            >
              {isLogin ? 'Create Account' : 'Login here'}
            </button>

          </p>

          {!isLogin && accountType !== 'Patient' && (
            <p className="auth-notice">
              Doctor and Admin accounts require Admin approval.
            </p>
          )}

        </div>

      </div>

    </div>
  )
}

export default Login