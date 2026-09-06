const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public pre-registration validation routes
router.post('/check-email', authController.checkEmailAvailability);
router.post('/check-phone', authController.checkPhoneAvailability);
router.post('/check-org', authController.checkOrgSimilarity);
router.post('/resolve-identifier', authController.resolveIdentifier);

module.exports = router;
