import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AuthContext from './authContext'
import { getCurrentUser, logoutUser } from '../services/authApi'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser)
          setStatus('authenticated')
        }
      })
      .catch((requestError) => {
        if (!active) {
          return
        }

        if (requestError.response?.status === 401) {
          setUser(null)
          setStatus('anonymous')
          return
        }

        setError('Unable to verify your sign-in session. Please try again.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  const setAuthenticatedUser = useCallback((authenticatedUser) => {
    setUser(authenticatedUser)
    setError('')
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
    setError('')
    setStatus('anonymous')
  }, [])

  const value = useMemo(() => ({
    user,
    status,
    error,
    setAuthenticatedUser,
    logout,
  }), [user, status, error, setAuthenticatedUser, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
