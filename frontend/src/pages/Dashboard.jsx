import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import { fetchDashboard } from '../services/dashboardApi'
import { fetchDoctors, fetchDoctorById, updateDoctor, deleteDoctor, createDoctor } from '../services/doctorApi'
import { deleteReview, fetchReviews } from '../services/reviewApi'
import {
  createPrescription,
  downloadPrescriptionPdf,
  fetchDoctorPrescriptions,
  fetchMyPrescriptions,
} from '../services/prescriptionApi'
import {
  downloadHealthReport,
  fetchDoctorPatientReports,
  fetchMyHealthReports,
  uploadHealthReport,
} from '../services/healthReportApi'
import {
  createDoctorAccount,
  deleteDoctorAccount,
  fetchDoctorAccounts,
  updateDoctorAccount,
} from '../services/accountApi'
import './Dashboard.css'

const WEEK_DAYS = [
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' },
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
]

const emptyDoctor = {
  _id: '',
  name: '',
  image: 'doc1',
  speciality: 'General physician',
  degree: '',
  experience: '',
  division: '',
  about: '',
  fees: 1000,
  visitingDays: [1, 2, 3, 4, 5],
  visitingHours: [],
  temporaryUnavailability: { startDate: '', endDate: '', returnDate: '', reason: '' },
  address: { line1: '', line2: '' },
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [newDoctor, setNewDoctor] = useState(emptyDoctor)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviews, setReviews] = useState([])
  const [doctorAccounts, setDoctorAccounts] = useState([])
  const [doctorAccountForm, setDoctorAccountForm] = useState({
    fullName: '',
    email: '',
    password: '',
    doctorId: '',
  })
  const [prescriptions, setPrescriptions] = useState([])
  const [reports, setReports] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    diagnosis: '',
    prescriptionDate: new Date().toISOString().slice(0, 10),
    notes: '',
    medicineName: '',
    medicineDosage: '',
    medicineDuration: '',
    medicineInstructions: '',
  })
  const [reportForm, setReportForm] = useState({
    reportType: 'Blood Test',
    title: '',
    reportDate: new Date().toISOString().slice(0, 10),
  })
  const [reportFile, setReportFile] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchDashboard()
      .then(setDashboard)
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load dashboard.'))
      .finally(() => setLoading(false))

    if (user.role === 'Admin') {
      fetchDoctors().then(setDoctors).catch(() => {})
      fetchReviews().then(setReviews).catch(() => {})
      fetchDoctorAccounts().then(setDoctorAccounts).catch(() => {})
    }
    if (user.role === 'Doctor' && user.doctorId) {
      fetchDoctorById(user.doctorId).then(setSelectedDoctor).catch(() => {})
      fetchDoctorPrescriptions().then(setPrescriptions).catch(() => {})
    }
    if (user.role === 'Patient') {
      fetchMyPrescriptions().then(setPrescriptions).catch(() => {})
      fetchMyHealthReports().then(setReports).catch(() => {})
    }
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (loading) return <p className="dashboard-status" role="status">Loading dashboard...</p>
  if (error) return <p className="dashboard-status dashboard-error" role="alert">{error}</p>

  const editDoctor = async (doctorId) => {
    try {
      setSelectedDoctor(await fetchDoctorById(doctorId))
      setNotice('')
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to load doctor.')
    }
  }

  const toggleVisitDay = (day) => {
    setSelectedDoctor((current) => ({
      ...current,
      visitingDays: (current.visitingDays || []).includes(day)
        ? (current.visitingDays || []).filter((item) => item !== day)
        : [...(current.visitingDays || []), day].sort(),
    }))
  }

  const saveDoctorSchedule = async () => {
    try {
      const saved = await updateDoctor(selectedDoctor._id, {
        visitingDays: selectedDoctor.visitingDays,
        visitingHours: selectedDoctor.visitingHours,
        temporaryUnavailability: selectedDoctor.temporaryUnavailability,
      })
      setSelectedDoctor(saved)
      setNotice('Doctor availability updated.')
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to update availability.')
    }
  }

  const removeDoctor = async (doctorId) => {
    if (!window.confirm('Remove this doctor from MedD?')) return
    try {
      await deleteDoctor(doctorId)
      setDoctors((current) => current.filter((doctor) => doctor._id !== doctorId))
      setSelectedDoctor(null)
      setNotice('Doctor removed.')
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to remove doctor.')
    }
  }

  const removeReview = async (reviewId) => {
    if (!window.confirm('Delete this patient review?')) return
    try {
      await deleteReview(reviewId)
      setReviews((current) => current.filter((review) => review._id !== reviewId))
      setNotice('Review deleted.')
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to delete review.')
    }

    const addDoctorAccount = async (event) => {
      event.preventDefault()
      try {
        const account = await createDoctorAccount(doctorAccountForm)
        setDoctorAccounts((current) => [...current, account])
        setDoctorAccountForm({ fullName: '', email: '', password: '', doctorId: '' })
        setNotice('Doctor login account created.')
      } catch (requestError) {
        setNotice(requestError.response?.data?.message || 'Unable to create Doctor account.')
      }
    }

    const toggleDoctorAccount = async (account) => {
      try {
        const updated = await updateDoctorAccount(account._id, { isActive: !account.isActive })
        setDoctorAccounts((current) =>
          current.map((item) => item._id === account._id ? updated : item),
        )
        setNotice(updated.isActive ? 'Doctor account activated.' : 'Doctor account deactivated.')
      } catch (requestError) {
        setNotice(requestError.response?.data?.message || 'Unable to update Doctor account.')
      }
    }

    const removeDoctorAccount = async (account) => {
      if (!window.confirm('Remove this Doctor login account?')) return
      try {
        await deleteDoctorAccount(account._id)
        setDoctorAccounts((current) => current.filter((item) => item._id !== account._id))
        setNotice('Doctor login account removed.')
      } catch (requestError) {
        setNotice(requestError.response?.data?.message || 'Unable to remove Doctor account.')
      }
    }
  }

  const issuePrescription = async (event) => {
    event.preventDefault()
    try {
      const issued = await createPrescription({
        patientId: prescriptionForm.patientId,
        diagnosis: prescriptionForm.diagnosis,
        prescriptionDate: prescriptionForm.prescriptionDate,
        notes: prescriptionForm.notes,
        medicines: [{
          name: prescriptionForm.medicineName,
          dosage: prescriptionForm.medicineDosage,
          duration: prescriptionForm.medicineDuration,
          instructions: prescriptionForm.medicineInstructions,
        }],
      })
      setPrescriptions((current) => [issued, ...current])
      setNotice('Digital prescription issued.')
      setPrescriptionForm((current) => ({
        ...current,
        diagnosis: '',
        notes: '',
        medicineName: '',
        medicineDosage: '',
        medicineDuration: '',
        medicineInstructions: '',
      }))
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to issue prescription.')
    }
  }

  const uploadReport = async (event) => {
    event.preventEvent?.()
    event.preventDefault()
    if (!reportFile) {
      setNotice('Select a PDF, JPG or PNG report file.')
      return
    }
    try {
      const formData = new FormData()
      formData.append('file', reportFile)
      formData.append('reportType', reportForm.reportType)
      formData.append('title', reportForm.title)
      formData.append('reportDate', reportForm.reportDate)
      const uploaded = await uploadHealthReport(formData)
      setReports((current) => [uploaded, ...current])
      setReportFile(null)
      setReportForm((current) => ({ ...current, title: '' }))
      setNotice('Health report uploaded securely.')
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to upload health report.')
    }
  }

  const loadPatientReports = async (patientId) => {
    setSelectedPatientId(patientId)
    if (!patientId) {
      setReports([])
      return
    }
    try {
      setReports(await fetchDoctorPatientReports(patientId))
    } catch (requestError) {
      setReports([])
      setNotice(requestError.response?.data?.message || 'Unable to access patient reports.')
    }
  }

  const addDoctor = async (event) => {
    event.preventDefault()
    try {
      const created = await createDoctor(newDoctor)
      setDoctors((current) => [...current, created])
      setNewDoctor(emptyDoctor)
      setNotice('Doctor added.')
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'Unable to add doctor.')
    }
  }

  const summary = dashboard.summary || {}

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <h1>{dashboard.role} Dashboard</h1>
        <p>Welcome back, {user.name}</p>
      </div>

      {notice && <p className="dashboard-notice" role="status">{notice}</p>}

      <div className="dashboard-summary-grid">
        {Object.entries(summary).map(([key, value]) => (
          <div className="dashboard-summary-card" key={key}>
            <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {(dashboard.role === 'Patient' || dashboard.role === 'Doctor') && (
        <section className="dashboard-section">
          <h2>{dashboard.role === 'Patient' ? 'Recent Appointments' : 'Doctor Appointments'}</h2>
          {(dashboard.recentAppointments || []).length === 0 ? (
            <p>No appointments found.</p>
          ) : (
            dashboard.recentAppointments.map((appointment) => (
              <div className="dashboard-appointment-row" key={appointment._id}>
                <strong>{appointment.appointmentDate} at {appointment.appointmentTime}</strong>
                <span>{appointment.status}</span>
              </div>
            ))
          )}
        </section>
      )}

      {dashboard.role === 'Patient' && (
        <>
          <section className="dashboard-section">
            <h2>Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <p>No prescriptions yet.</p>
            ) : (
              <div className="medical-record-list">
                {prescriptions.map((prescription) => (
                  <article className="medical-record-row" key={prescription._id}>
                    <div>
                      <strong>{prescription.diagnosis}</strong>
                      <span>{prescription.prescriptionDate} • Dr. {prescription.doctorName}</span>
                    </div>
                    <button type="button" onClick={() => downloadPrescriptionPdf(prescription._id)}>
                      Download PDF
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <h2>Health Reports</h2>
            <form className="report-upload-form" onSubmit={uploadReport}>
              <select value={reportForm.reportType} onChange={(event) => setReportForm((current) => ({ ...current, reportType: event.target.value }))}>
                <option>Blood Test</option>
                <option>X-ray</option>
                <option>MRI</option>
                <option>ECG</option>
                <option>Ultrasound</option>
                <option>Other</option>
              </select>
              <input required placeholder="Report title" value={reportForm.title} onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))} />
              <input required type="date" value={reportForm.reportDate} onChange={(event) => setReportForm((current) => ({ ...current, reportDate: event.target.value }))} />
              <input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setReportFile(event.target.files?.[0] || null)} />
              <button type="submit">Upload Report</button>
            </form>
            {reports.length === 0 ? (
              <p>No health reports uploaded.</p>
            ) : (
              <div className="medical-record-list">
                {reports.map((report) => (
                  <article className="medical-record-row" key={report._id}>
                    <div>
                      <strong>{report.title}</strong>
                      <span>{report.reportType} • {report.reportDate}</span>
                    </div>
                    <button type="button" onClick={() => downloadHealthReport(report._id, report.originalName)}>
                      Download
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {dashboard.role === 'Doctor' && (
        <>
          <section className="dashboard-section">
            <h2>Prescriptions</h2>
            <form className="prescription-form" onSubmit={issuePrescription}>
              <select required value={prescriptionForm.patientId} onChange={(event) => setPrescriptionForm((current) => ({ ...current, patientId: event.target.value }))}>
                <option value="">Select patient</option>
                {[...(new Map((dashboard.recentAppointments || [])
                  .filter((appointment) => appointment.patient)
                  .map((appointment) => [appointment.patient._id, appointment.patient]))).values()]
                  .map((patient) => (
                    <option key={patient._id} value={patient._id}>{patient.fullName}</option>
                  ))}
              </select>
              <input required placeholder="Diagnosis" value={prescriptionForm.diagnosis} onChange={(event) => setPrescriptionForm((current) => ({ ...current, diagnosis: event.target.value }))} />
              <input required type="date" value={prescriptionForm.prescriptionDate} onChange={(event) => setPrescriptionForm((current) => ({ ...current, prescriptionDate: event.target.value }))} />
              <input required placeholder="Medicine name" value={prescriptionForm.medicineName} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medicineName: event.target.value }))} />
              <input required placeholder="Dosage" value={prescriptionForm.medicineDosage} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medicineDosage: event.target.value }))} />
              <input required placeholder="Duration" value={prescriptionForm.medicineDuration} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medicineDuration: event.target.value }))} />
              <input placeholder="Medicine instructions" value={prescriptionForm.medicineInstructions} onChange={(event) => setPrescriptionForm((current) => ({ ...current, medicineInstructions: event.target.value }))} />
              <textarea placeholder="Additional notes" value={prescriptionForm.notes} onChange={(event) => setPrescriptionForm((current) => ({ ...current, notes: event.target.value }))} />
              <button type="submit">Issue Prescription</button>
            </form>
            {prescriptions.map((prescription) => (
              <div className="medical-record-row" key={prescription._id}>
                <div>
                  <strong>{prescription.patientName}</strong>
                  <span>{prescription.diagnosis} • {prescription.prescriptionDate}</span>
                </div>
                <button type="button" onClick={() => downloadPrescriptionPdf(prescription._id)}>Download PDF</button>
              </div>
            ))}
          </section>

          <section className="dashboard-section">
            <h2>Patient Health Reports</h2>
            <select value={selectedPatientId} onChange={(event) => loadPatientReports(event.target.value)}>
              <option value="">Select patient</option>
              {[...(new Map((dashboard.recentAppointments || [])
                .filter((appointment) => appointment.patient)
                .map((appointment) => [appointment.patient._id, appointment.patient]))).values()]
                .map((patient) => (
                  <option key={patient._id} value={patient._id}>{patient.fullName}</option>
                ))}
            </select>
            {reports.map((report) => (
              <div className="medical-record-row" key={report._id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>{report.reportType} • {report.reportDate}</span>
                </div>
                <button type="button" onClick={() => downloadHealthReport(report._id, report.originalName)}>Download</button>
              </div>
            ))}
          </section>
        </>
      )}

      {(dashboard.role === 'Doctor' || dashboard.role === 'Admin') && (
        <section className="dashboard-section">
          <h2>Doctor Availability</h2>
          {dashboard.role === 'Admin' && (
            <select
              value={selectedDoctor?._id || ''}
              onChange={(event) => editDoctor(event.target.value)}
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
              ))}
            </select>
          )}
          {selectedDoctor && (
            <div className="availability-editor">
              <h3>{selectedDoctor.name}</h3>
              <div className="day-card-grid" role="group" aria-label="Weekly visiting days">
                {WEEK_DAYS.map(({ day, name }) => (
                  <button
                    type="button"
                    key={day}
                    className={`day-card ${(selectedDoctor.visitingDays || []).includes(day) ? 'active' : ''}`}
                    aria-pressed={(selectedDoctor.visitingDays || []).includes(day)}
                    onClick={() => toggleVisitDay(day)}
                  >
                    <span>{name}</span>
                  </button>
                ))}
              </div>
              <label>Temporary unavailable start
                <input type="date" value={selectedDoctor.temporaryUnavailability?.startDate || ''} onChange={(event) => setSelectedDoctor((current) => ({ ...current, temporaryUnavailability: { ...current.temporaryUnavailability, startDate: event.target.value } }))} />
              </label>
              <label>Temporary unavailable end
                <input type="date" value={selectedDoctor.temporaryUnavailability?.endDate || ''} onChange={(event) => setSelectedDoctor((current) => ({ ...current, temporaryUnavailability: { ...current.temporaryUnavailability, endDate: event.target.value } }))} />
              </label>
              <button type="button" onClick={saveDoctorSchedule}>Save Availability</button>
            </div>
          )}
        </section>
      )}

      {dashboard.role === 'Admin' && (
        <>
          <section className="dashboard-section">
            <h2>Doctor Login Accounts</h2>
            <form className="add-doctor-account-form" onSubmit={addDoctorAccount}>
              <input
                required
                placeholder="Doctor name"
                value={doctorAccountForm.fullName}
                onChange={(event) => setDoctorAccountForm((current) => ({ ...current, fullName: event.target.value }))}
              />
              <input
                required
                type="email"
                placeholder="Doctor email"
                value={doctorAccountForm.email}
                onChange={(event) => setDoctorAccountForm((current) => ({ ...current, email: event.target.value }))}
              />
              <input
                required
                type="password"
                minLength="8"
                placeholder="Temporary password"
                value={doctorAccountForm.password}
                onChange={(event) => setDoctorAccountForm((current) => ({ ...current, password: event.target.value }))}
              />
              <select
                required
                value={doctorAccountForm.doctorId}
                onChange={(event) => setDoctorAccountForm((current) => ({ ...current, doctorId: event.target.value }))}
              >
                <option value="">Select Doctor profile</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                ))}
              </select>
              <button type="submit">Create Doctor Account</button>
            </form>

            <div className="doctor-account-list">
              {doctorAccounts.map((account) => (
                <div className="admin-doctor-row" key={account._id}>
                  <strong>{account.fullName}</strong>
                  <span>{account.email} • {account.doctorId}</span>
                  <button type="button" onClick={() => toggleDoctorAccount(account)}>
                    {account.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" className="danger" onClick={() => removeDoctorAccount(account)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Patient Reviews</h2>
            {reviews.length === 0 ? (
              <p>No patient reviews yet.</p>
            ) : (
              <div className="admin-review-list">
                {reviews.map((review) => (
                  <div className="admin-review-row" key={review._id}>
                    <strong>{review.name}</strong>
                    <span>{review.rating}/5 • {review.message}</span>
                    <button type="button" className="danger" onClick={() => removeReview(review._id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <h2>Doctor Management</h2>
            <div className="admin-doctor-list">
              {doctors.map((doctor) => (
                <div className="admin-doctor-row" key={doctor._id}>
                  <strong>{doctor.name}</strong>
                  <span>{doctor.speciality} • ৳{doctor.fees}</span>
                  <button type="button" onClick={() => editDoctor(doctor._id)}>Manage</button>
                  <button type="button" className="danger" onClick={() => removeDoctor(doctor._id)}>Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Add Doctor</h2>
            <form className="add-doctor-form" onSubmit={addDoctor}>
              <input required placeholder="Stable doctor ID" value={newDoctor._id} onChange={(event) => setNewDoctor((current) => ({ ...current, _id: event.target.value }))} />
              <input required placeholder="Doctor name" value={newDoctor.name} onChange={(event) => setNewDoctor((current) => ({ ...current, name: event.target.value }))} />
              <input required placeholder="Image key" value={newDoctor.image} onChange={(event) => setNewDoctor((current) => ({ ...current, image: event.target.value }))} />
              <input required placeholder="Speciality" value={newDoctor.speciality} onChange={(event) => setNewDoctor((current) => ({ ...current, speciality: event.target.value }))} />
              <input required placeholder="Degree" value={newDoctor.degree} onChange={(event) => setNewDoctor((current) => ({ ...current, degree: event.target.value }))} />
              <input required placeholder="Experience" value={newDoctor.experience} onChange={(event) => setNewDoctor((current) => ({ ...current, experience: event.target.value }))} />
              <input required placeholder="Division" value={newDoctor.division} onChange={(event) => setNewDoctor((current) => ({ ...current, division: event.target.value }))} />
              <input required type="number" min="0" placeholder="Fee" value={newDoctor.fees} onChange={(event) => setNewDoctor((current) => ({ ...current, fees: Number(event.target.value) }))} />
              <input required placeholder="Address line 1" value={newDoctor.address.line1} onChange={(event) => setNewDoctor((current) => ({ ...current, address: { ...current.address, line1: event.target.value } }))} />
              <input required placeholder="Address line 2" value={newDoctor.address.line2} onChange={(event) => setNewDoctor((current) => ({ ...current, address: { ...current.address, line2: event.target.value } }))} />
              <textarea placeholder="About" value={newDoctor.about} onChange={(event) => setNewDoctor((current) => ({ ...current, about: event.target.value }))} />
              <button type="submit">Add Doctor</button>
            </form>
          </section>
        </>
      )}

      <button className="dashboard-profile-button" type="button" onClick={() => navigate('/my-profile')}>My Profile</button>
    </div>
  )
}

export default Dashboard
