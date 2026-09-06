/**
 * Validation middlewares for Appointment & Bed Booking endpoints
 */
const bookingValidators = {
  validateAppointmentBooking: (req, res, next) => {
    const { doctorId, appointmentDate, appointmentTime, consultationType } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        error: { message: 'doctorId is required for booking an appointment.' }
      });
    }

    if (!appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      return res.status(400).json({
        success: false,
        error: { message: 'appointmentDate is required in YYYY-MM-DD format.' }
      });
    }

    if (!appointmentTime) {
      return res.status(400).json({
        success: false,
        error: { message: 'appointmentTime is required (e.g. "10:30 AM").' }
      });
    }

    if (consultationType && !['in_clinic', 'video'].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'consultationType must be either "in_clinic" or "video".' }
      });
    }

    next();
  },

  validateCancelBooking: (req, res, next) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'A valid appointment UUID is required.' }
      });
    }

    next();
  }
};

module.exports = bookingValidators;
