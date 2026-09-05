const express = require('express');
const router = express.Router();

const hospitalController = require('../controllers/hospitalController');
const hospitalValidators = require('../validators/hospitalValidators');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// =============================================================================
// PUBLIC HOSPITAL DISCOVERY & CLINICAL DETAILS
// =============================================================================

// 1. Search & Filter Hospitals Marketplace
router.get('/', hospitalValidators.validateQueryParams, hospitalController.getHospitals);

// 2. Patient Saved Bookmarks (Placed before /:id to prevent route shadowing)
router.get('/saved/list', requireAuth, requireRole('patient'), hospitalController.getSavedHospitals);

// 3. Complete Hospital Clinical Profile by ID or Slug
router.get('/:id', hospitalController.getHospitalById);

// 4. Live Bed Inventory
router.get('/:id/beds', hospitalController.getHospitalBeds);

// 5. Verified Specialist Doctors
router.get('/:id/doctors', hospitalController.getHospitalDoctors);

// 6. Transparent Treatment Packages
router.get('/:id/packages', hospitalController.getHospitalPackages);

// 7. Empanelled Schemes & TPAs
router.get('/:id/schemes', hospitalController.getHospitalSchemes);

// =============================================================================
// PROTECTED PATIENT ACTIONS: SAVES & 30-MINUTE EMERGENCY BED HOLDS
// =============================================================================

// 8. Toggle Save / Bookmark Hospital
router.post('/:id/save', requireAuth, requireRole('patient'), hospitalController.toggleSaveHospital);

// 9. Place 30-Minute Live Bed Hold
router.post(
  '/:id/hold-bed',
  requireAuth,
  requireRole('patient'),
  hospitalValidators.validateBedHold,
  hospitalController.reserveBedHold
);

// 10. Release and Cancel Bed Hold
router.post(
  '/hold-bed/:holdId/release',
  requireAuth,
  requireRole('patient'),
  hospitalController.releaseBedHold
);

module.exports = router;
