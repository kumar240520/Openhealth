const { query, body, param, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for emergency request parameters',
      errors: errors.array().map(e => ({
        field: e.path || e.param,
        message: e.msg,
        value: e.value
      }))
    });
  }
  next();
};

const validateNearbyHospitals = [
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be a valid float between -90 and 90'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be a valid float between -180 and 180'),
  query('radiusM')
    .optional()
    .isInt({ min: 500, max: 100000 })
    .withMessage('radiusM must be an integer between 500 and 100000 meters'),
  handleValidationErrors
];

const validateStartSession = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('emergencyType')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('emergencyType must be between 2 and 100 characters'),
  body('searchRadiusM')
    .optional()
    .isInt({ min: 1000, max: 50000 })
    .withMessage('searchRadiusM must be between 1000 and 50000 meters'),
  handleValidationErrors
];

const validateDispatch = [
  body('sessionId')
    .isUUID()
    .withMessage('Valid sessionId UUID is required'),
  body('hospitalId')
    .isUUID()
    .withMessage('Valid hospitalId UUID is required'),
  body('ambulanceId')
    .optional()
    .isUUID()
    .withMessage('ambulanceId must be a valid UUID if provided'),
  body('pickupLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('pickupLatitude must be a valid float'),
  body('pickupLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('pickupLongitude must be a valid float'),
  handleValidationErrors
];

const validateUpdateStatus = [
  param('id')
    .isUUID()
    .withMessage('Valid emergency session UUID is required'),
  body('status')
    .isIn([
      'searching',
      'match_found',
      'request_sent',
      'ambulance_assigned',
      'hospital_contacted',
      'hospital_confirmed',
      'en_route',
      'arrived',
      'cancelled',
      'failed'
    ])
    .withMessage('Invalid emergency session status enum value'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateNearbyHospitals,
  validateStartSession,
  validateDispatch,
  validateUpdateStatus
};
