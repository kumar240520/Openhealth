const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// 1. Public / Provider Instant QR Scan Engine (EHR Retrieval by UID)
router.get('/scan/:uid', patientController.getPatientByUid);

// All subsequent patient endpoints require authentication and patient/admin role
router.use(requireAuth);

router.post('/onboarding', requireRole(['patient', 'platform_admin']), patientController.saveOnboarding);
router.get('/profile', requireRole(['patient', 'platform_admin']), patientController.getProfile);
router.put('/profile', requireRole(['patient', 'platform_admin']), patientController.updateProfile);
router.patch('/location', requireRole(['patient', 'platform_admin']), patientController.updateLocation);

// Settings & Preferences
router.get('/settings', requireRole(['patient', 'platform_admin']), patientController.getSettings);
router.put('/settings', requireRole(['patient', 'platform_admin']), patientController.updateSettings);

// Unified Saved Items (Hospitals & Doctors)
router.get('/saved', requireRole(['patient', 'platform_admin']), patientController.getSavedItems);

// KYC Document Submission & Verification
router.post('/kyc', requireRole(['patient', 'platform_admin']), patientController.submitKYC);

// Credential Correction Appeal & Support
router.post('/appeal', requireRole(['patient', 'platform_admin']), patientController.submitAppeal);

module.exports = router;
