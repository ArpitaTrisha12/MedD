
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'

import Home from './pages/Home'
import Doctors from './pages/Doctors'
import MyAppointments from './pages/MyAppointments'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import Appointment from './pages/Appointment'
import useAuth from './context/useAuth'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation()
  const { user, status, error } = useAuth()

  if (status === 'loading') {
    return <p role="status">Checking your sign-in status...</p>
  }

  if (status === 'error') {
    return <p role="alert">{error}</p>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const App = () => {
  return (
    <div className="mx-4 sm:mx-[5%]">

      <Navbar />

      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        {/* About redirects to Home Top Doctors Section */}
        <Route
          path="/about"
          element={<Navigate to="/#more-doctors" replace />}
        />

        {/* Protected Routes */}
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />

        {/* Profile Setup */}
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Doctors */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors/:speciality"
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          }
        />

        {/* Appointment */}
        <Route
          path="/appointment/:docId"
          element={
            <ProtectedRoute>
              <Appointment />
            </ProtectedRoute>
          }
        />

        {/* My Profile */}
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />

        {/* My Appointments */}
        <Route
          path="/my-appointments"
          element={
            <ProtectedRoute roles={['Patient']}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </div>
  )
}

export default App
