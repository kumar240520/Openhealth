const bookingService = require('../services/bookings/bookingService');

/**
 * Healthcare Bookings & Appointments Controller
 */
const bookingController = {
  /**
   * POST /api/v1/bookings/appointment
   */
  createAppointment: async (req, res, next) => {
    try {
      const {
        doctorId,
        hospitalId,
        appointmentDate,
        appointmentTime,
        consultationType,
        patientNotes
      } = req.body;

      const appointment = await bookingService.createAppointment({
        userId: req.userId,
        doctorId,
        hospitalId,
        appointmentDate,
        appointmentTime,
        consultationType,
        patientNotes
      });

      return res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bookings/my-bookings
   */
  getPatientBookings: async (req, res, next) => {
    try {
      const { type } = req.query;
      const bookings = await bookingService.getPatientBookings(req.userId, type);
      return res.status(200).json({
        success: true,
        data: bookings
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/bookings/appointments/:id/cancel
   */
  cancelAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await bookingService.cancelAppointment(req.userId, id, reason);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/bookings/reservations/:id/cancel
   */
  cancelReservation: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await bookingService.cancelReservation(req.userId, id, reason);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/bookings/daily-slots?date=YYYY-MM-DD&doctorId=UUID
   */
  getDailySlotStatus: async (req, res, next) => {
    try {
      const { date, doctorId } = req.query;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "date" (YYYY-MM-DD) is required.'
        });
      }

      const status = await bookingService.getPatientDailySlots({
        userId: req.userId,
        appointmentDate: date,
        doctorId
      });

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = bookingController;
