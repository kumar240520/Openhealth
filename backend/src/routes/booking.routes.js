const express = require('express');
const router = express.Router();

const bookingController = require('../controllers/bookingController');
const bookingValidators = require('../validators/bookingValidators');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All booking operations require authenticated patient or platform_admin role
router.use(requireAuth);
router.use(requireRole(['patient', 'platform_admin']));

// 1. Book Specialist Doctor Appointment
router.post(
  '/appointment',
  bookingValidators.validateAppointmentBooking,
  bookingController.createAppointment
);

// 2. Fetch All Patient Bookings (Doctor Appointments, Bed Holds & Admissions)
router.get(
  '/my-bookings',
  bookingController.getPatientBookings
);

// 3. Query Daily Appointment Slot Availability & Doctor Uniqueness
router.get(
  '/daily-slots',
  bookingController.getDailySlotStatus
);

// 3. Cancel Appointment
router.patch(
  '/appointments/:id/cancel',
  bookingValidators.validateCancelBooking,
  bookingController.cancelAppointment
);

// 4. Cancel Bed Reservation
router.patch(
  '/reservations/:id/cancel',
  bookingController.cancelReservation
);

module.exports = router;
