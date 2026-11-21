import Appointment from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'
import Patient from '../models/Patient.js'
import Admin from '../models/Admin.js'

const isUpcoming = (appointment) =>
  appointment.status !== 'Cancelled' &&
  appointment.status !== 'Completed'

export const getDashboard = async (req, res, next) => {
  try {
    if (req.accountRole === 'Patient') {
      const appointments = await Appointment.find({ patient: req.user._id })
        .sort({ appointmentDate: 1, appointmentTime: 1 })
        .lean()
      const upcoming = appointments.filter(isUpcoming)

      return res.json({
        role: 'Patient',
        summary: {
          totalAppointments: appointments.length,
          upcomingAppointments: upcoming.length,
          completedAppointments: appointments.filter((item) => item.status === 'Completed').length,
        },
        nextAppointment: upcoming[0] || null,
        recentAppointments: appointments.slice(-5).reverse(),
      })
    }

    if (req.accountRole === 'Doctor') {
      const appointments = req.user.doctorId
        ? await Appointment.find({ doctor: req.user.doctorId })
          .populate('patient', 'fullName email')
          .sort({ appointmentDate: 1, appointmentTime: 1 })
          .lean()
        : []
      const today = new Date().toISOString().slice(0, 10)

      return res.json({
        role: 'Doctor',
        summary: {
          totalAppointments: appointments.length,
          todayAppointments: appointments.filter(
            (item) => item.appointmentDate === today && item.status !== 'Cancelled',
          ).length,
          pendingAppointments: appointments.filter((item) => item.status === 'Pending').length,
        },
        doctorId: req.user.doctorId || null,
        recentAppointments: appointments.slice(-5).reverse(),
      })
    }

    const [patients, doctors, admins, appointments] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Admin.countDocuments(),
      Appointment.countDocuments(),
    ])

    res.json({
      role: 'Admin',
      summary: {
        patients,
        doctors,
        admins,
        appointments,
        pendingAppointments: await Appointment.countDocuments({ status: 'Pending' }),
        cancelledAppointments: await Appointment.countDocuments({ status: 'Cancelled' }),
      },
      recentDoctors: await Doctor.find().sort({ order: 1 }).limit(5).lean(),
    })
  } catch (error) {
    next(error)
  }
}
