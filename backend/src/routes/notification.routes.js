const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markRead);
router.patch('/mark-all-read', notificationController.markAllRead);

module.exports = router;
