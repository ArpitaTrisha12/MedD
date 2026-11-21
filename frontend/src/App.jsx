
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'

import Home from './pages/Home'
import Doctors from './pages/Doctors'
import MyAppointments from './pages/MyAppointments'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import Appointment from './pages/Appointment'
import useAuth from './context/useAuth'
//import ProfileSetup from './pages/ProfileSetup'
//import Dashboard from './pages/Dashboard'

const ProtectedRoute = ({ children }) => {
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

        {/* Protected Routes */}
        <Route
          path="/about"
          element={<ProtectedRoute><About /></ProtectedRoute>}
        />

        <Route
          path="/contact"
          element={<ProtectedRoute><Contact /></ProtectedRoute>}
        />

        {/*<Route
          path="/profile-setup"
          element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>}
        />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />*/}

        <Route
          path="/doctors"
          element={<ProtectedRoute><Doctors /></ProtectedRoute>}
        />

        <Route
          path="/doctors/:speciality"
          element={<ProtectedRoute><Doctors /></ProtectedRoute>}
        />

        <Route
          path="/appointment/:docId"
          element={<ProtectedRoute><Appointment /></ProtectedRoute>}
        />

        <Route
          path="/my-profile"
          element={<ProtectedRoute><MyProfile /></ProtectedRoute>}
        />

        <Route
          path="/my-appointments"
          element={<ProtectedRoute><MyAppointments /></ProtectedRoute>}
        />

        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  )
}

export default App
