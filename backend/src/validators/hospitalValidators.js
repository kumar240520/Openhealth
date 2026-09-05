/**
 * Validation middlewares for Hospital Discovery endpoints
 */
const hospitalValidators = {
  // Validate Hospital Search Query Params
  validateQueryParams: (req, res, next) => {
    const { minScore, limit, offset, sortBy, order } = req.query;

    if (minScore !== undefined && (isNaN(minScore) || minScore < 0 || minScore > 100)) {
      return res.status(400).json({
        success: false,
        error: { message: 'minScore must be a number between 0 and 100.' }
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

    const validSorts = ['transparency', 'beds', 'rating', 'name'];
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

  // Validate Bed Hold Request Body
  validateBedHold: (req, res, next) => {
    let { bedType } = req.body;
    
    // Normalization: allow 'ICU Bed', 'General Ward', etc.
    if (!bedType) {
      req.body.bedType = 'ICU';
      return next();
    }

    const bLower = bedType.toLowerCase();
    if (bLower.includes('icu') || bLower.includes('ventilator')) {
      req.body.bedType = 'ICU';
    } else if (bLower.includes('general') || bLower.includes('ward')) {
      req.body.bedType = 'General';
    } else if (bLower.includes('pediatric')) {
      req.body.bedType = 'Pediatric';
    } else if (bLower.includes('emergency') || bLower.includes('trauma')) {
      req.body.bedType = 'Emergency';
    } else if (bLower.includes('hdu')) {
      req.body.bedType = 'HDU';
    }

    next();
  }
};

module.exports = hospitalValidators;
