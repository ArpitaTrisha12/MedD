import { useEffect, useState } from 'react'
import { fetchDoctors } from '../services/doctorApi'

const useDoctors = () => {
  const [doctors, setDoctors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    fetchDoctors(controller.signal)
      .then(setDoctors)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(`Unable to load doctors: ${requestError.message}`)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return { doctors, isLoading, error }
}

export default useDoctors
