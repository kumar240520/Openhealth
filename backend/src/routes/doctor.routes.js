const express = require('express');
const router = express.Router();

const doctorController = require('../controllers/doctorController');
const doctorValidators = require('../validators/doctorValidators');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// =============================================================================
// PUBLIC DOCTOR DISCOVERY & CLINICAL DOSSIERS
// =============================================================================

// 1. Search & Filter Verified Specialist Doctors
router.get('/', doctorValidators.validateDoctorQuery, doctorController.getDoctors);

// 2. Distinct Clinical Specialties Catalogue (Placed before /:id to prevent route shadowing)
router.get('/specialties', doctorController.getSpecialties);

// 3. Patient Saved / Bookmarked Doctors List
router.get('/saved/list', requireAuth, requireRole(['patient', 'platform_admin']), doctorController.getSavedDoctors);

// 4. Complete Doctor Clinical Dossier by UUID
router.get('/:id', doctorController.getDoctorById);

// 5. Dynamic Slot Availability for a Specific Date
router.get('/:id/slots', doctorValidators.validateSlotDate, doctorController.getDoctorSlots);

// =============================================================================
// PROTECTED PATIENT ACTIONS
// =============================================================================

// 6. Toggle Bookmark / Save Doctor
router.post('/:id/save', requireAuth, requireRole(['patient', 'platform_admin']), doctorController.toggleSaveDoctor);

module.exports = router;
