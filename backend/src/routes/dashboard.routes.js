const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(requireAuth);

// Patient Dashboard Telemetry
router.get('/patient', requireRole(['patient', 'platform_admin']), dashboardController.getPatientDashboard);

module.exports = router;
