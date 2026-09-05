const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/log', searchController.logSearch);
router.get('/recent', searchController.getRecentSearches);

module.exports = router;
