const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');

// All report routes require authentication
router.use(requireAuth);

// GET /api/v1/reports - Full reports dashboard payload
router.get('/', reportController.getReportsDashboardData);

// GET /api/v1/reports/timeline - Chronological health timeline
router.get('/timeline', reportController.getTimeline);

// GET /api/v1/reports/tests - Test reports from bookings
router.get('/tests', reportController.getTestReports);

// POST /api/v1/reports/upload - Upload a new report
router.post('/upload', reportController.uploadReport);

module.exports = router;
