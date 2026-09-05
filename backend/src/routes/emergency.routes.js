const express = require('express');
const router = express.Router();

const emergencyController = require('../controllers/emergencyController');
const emergencyValidators = require('../validators/emergencyValidators');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');

// 1. Get Ranked Nearby Hospitals (Public or Authenticated)
router.get(
  '/nearby',
  emergencyValidators.validateNearbyHospitals,
  emergencyController.getNearbyHospitals
);

// 2. Emergency Orchestration Operations (Optional Auth - Guests & Authenticated Patients allowed)
router.use(optionalAuth);

// 3. Check for Active In-Flight Emergency Session (for page rehydration)
router.get(
  '/active',
  emergencyController.getActiveSession
);

// 4. Initialize Live Emergency Session
router.post(
  '/session',
  emergencyValidators.validateStartSession,
  emergencyController.startSession
);

// 5. Dispatch Ambulance for Selected Hospital
router.post(
  '/dispatch',
  emergencyValidators.validateDispatch,
  emergencyController.dispatchAmbulance
);

// 6. Update Emergency Session Status (cancelled, arrived, completed)
router.patch(
  '/session/:id/status',
  emergencyValidators.validateUpdateStatus,
  emergencyController.updateStatus
);

module.exports = router;
