import { useNavigate, useSearchParams } from 'react-router-dom'
import { doctorImages, specialityData } from '../assets/assets'
import useDoctors from '../hooks/useDoctors'
import './Doctors.css'

const divisions = [
  'All Bangladesh',
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
]

const Doctors = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { doctors, isLoading, error } = useDoctors()

  const selectedSpeciality = searchParams.get('speciality') || ''
  const selectedDivision =
    searchParams.get('division') || 'All Bangladesh'

  const handleFilter = (speciality) => {
    const params = new URLSearchParams(searchParams)

    if (selectedSpeciality === speciality) {
      params.delete('speciality')
    } else {
      params.set('speciality', speciality)
    }

    setSearchParams(params)
  }

  const handleDivisionChange = (e) => {
    const params = new URLSearchParams(searchParams)
    const division = e.target.value

    if (division === 'All Bangladesh') {
      params.delete('division')
    } else {
      params.set('division', division)
    }

    setSearchParams(params)
  }

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSpeciality =
      !selectedSpeciality ||
      doctor.speciality === selectedSpeciality

    const matchesDivision =
      selectedDivision === 'All Bangladesh' ||
      doctor.division?.toLowerCase() === selectedDivision.toLowerCase()

    return matchesSpeciality && matchesDivision
  })

  return (
    <div className="doctors-page">

      <h2>Find Your Doctor</h2>

      <p className="doctors-subtitle">
        Browse through our trusted doctors and book your appointment.
      </p>

      <div className="doctors-container">

        {/* Speciality Filter */}
        <div className="doctors-filter">

          <h3>Filter by Speciality</h3>

          <button
            className={!selectedSpeciality ? 'active' : ''}
            onClick={() => setSearchParams(
              selectedDivision === 'All Bangladesh'
                ? {}
                : { division: selectedDivision }
            )}
          >
            All Doctors
          </button>

          {specialityData.map((item, index) => (
            <button
              key={index}
              className={
                selectedSpeciality === item.speciality ? 'active' : ''
              }
              onClick={() => handleFilter(item.speciality)}
            >
              {item.speciality}
            </button>
          ))}

        </div>

        {/* Doctors Content */}
        <div className="doctors-content">

          <div className="doctors-topbar">

            <h3>
              {selectedSpeciality || 'All Doctors'}
            </h3>

            {/* Division Filter */}
            <div className="district-filter">

              <label htmlFor="division">
                Select Division
              </label>

              <select
                id="division"
                value={selectedDivision}
                onChange={handleDivisionChange}
              >
                {divisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>

            </div>

          </div>

          {/* Doctor Cards */}
          <div className="doctors-grid">

            {isLoading && (
              <p className="no-doctors">Loading doctors...</p>
            )}

            {error && (
              <p className="no-doctors" role="alert">{error}</p>
            )}

            {!isLoading && !error && filteredDoctors.map((doctor) => (
              <div className="doctor-card" key={doctor._id}>

                <div className="doctor-image">
                  <img
                    src={doctorImages[doctor.image] || doctor.image}
                    alt={doctor.name}
                  />
                </div>

                <div className="doctor-info">

                  <p className="doctor-available">
                    <span></span>
                    Available
                  </p>

                  <h3>{doctor.name}</h3>

                  <p>{doctor.speciality}</p>

                  <p className="doctor-degree">
                    {doctor.degree} • {doctor.experience}
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/appointment/${doctor._id}`)
                    }
                  >
                    Book Appointment
                  </button>

                </div>
              </div>
            ))}

            {!isLoading && !error && filteredDoctors.length === 0 && (
              <p className="no-doctors">
                No doctors found in this division or speciality.
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default Doctors