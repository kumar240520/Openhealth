/**
 * Validation middlewares for Doctor Discovery & Clinical Profile endpoints
 */
const doctorValidators = {
  // Validate Doctor Search & Filter Query Params
  validateDoctorQuery: (req, res, next) => {
    const { minRating, maxFee, minExperience, limit, offset, sortBy, order } = req.query;

    if (minRating !== undefined && (isNaN(minRating) || parseFloat(minRating) < 0 || parseFloat(minRating) > 5)) {
      return res.status(400).json({
        success: false,
        error: { message: 'minRating must be a number between 0 and 5.' }
      });
    }

    if (maxFee !== undefined && (isNaN(maxFee) || parseFloat(maxFee) < 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'maxFee must be a positive number.' }
      });
    }

    if (minExperience !== undefined && (isNaN(minExperience) || parseInt(minExperience) < 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'minExperience must be a non-negative integer.' }
      });
    }

    if (limit !== undefined && (isNaN(limit) || parseInt(limit) <= 0 || parseInt(limit) > 100)) {
      return res.status(400).json({
        success: false,
        error: { message: 'limit must be a positive integer up to 100.' }
      });
    }

    if (offset !== undefined && (isNaN(offset) || parseInt(offset) < 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'offset must be a non-negative integer.' }
      });
    }

    const validSorts = ['rating', 'experience', 'fee_asc', 'fee_desc', 'name'];
    if (sortBy && !validSorts.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: { message: `sortBy must be one of: ${validSorts.join(', ')}` }
      });
    }

    if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: { message: 'order must be either asc or desc.' }
      });
    }

    next();
  },

  // Validate Slot Date
  validateSlotDate: (req, res, next) => {
    const { date } = req.query;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: { message: 'date must be in YYYY-MM-DD format.' }
      });
    }
    next();
  }
};

module.exports = doctorValidators;
