const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// POST /api/v1/ai/recommend - Run multi-modal recommendation analysis (authenticated patient or guest discovery)
router.post('/recommend', optionalAuth, aiController.analyzeAndRecommend);

// Historical AI assessment sessions require patient authentication
router.get('/sessions', requireAuth, aiController.getPastSessions);

// Retrieve single session requires patient authentication
router.get('/sessions/:id', requireAuth, aiController.getSessionById);

module.exports = router;
