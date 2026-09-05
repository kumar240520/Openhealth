const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { requireAuth } = require('../middleware/authMiddleware');

// All bill routes require authentication
router.use(requireAuth);

// GET /api/v1/bills/packages - Get treatment packages for dynamic dropdowns
router.get('/packages', billController.getAvailablePackages);

// GET /api/v1/bills - Get all bills for the authenticated patient
router.get('/', billController.getPatientBills);

// POST /api/v1/bills - Upload / register a new bill
router.post('/', billController.uploadBill);

// POST /api/v1/bills/rating - Submit rating for a bill/hospital
router.post('/rating', billController.submitRating);

// GET /api/v1/bills/:id/comparison - Get 3-way multi-dimensional comparison for a bill
router.get('/:id/comparison', billController.getBillComparison);

// POST /api/v1/bills/:id/audit - Run AI audit on bill with Google Gemini
router.post('/:id/audit', billController.auditBill);

// GET /api/v1/bills/:id - Get bill details by ID
router.get('/:id', billController.getBillById);

// POST /api/v1/bills/:id/rating - Submit rating for a specific bill
router.post('/:id/rating', billController.submitRating);

module.exports = router;
