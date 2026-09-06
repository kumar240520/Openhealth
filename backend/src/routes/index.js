const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const dashboardRoutes = require('./dashboard.routes');
const notificationRoutes = require('./notification.routes');
const searchRoutes = require('./search.routes');
const hospitalRoutes = require('./hospital.routes');
const doctorRoutes = require('./doctor.routes');
const bookingRoutes = require('./booking.routes');
const emergencyRoutes = require('./emergency.routes');
const billRoutes = require('./bill.routes');
const reportRoutes = require('./report.routes');
const aiRoutes = require('./ai.routes');
const hospitalPortalRoutes = require('./hospitalPortal.routes');
const adminRoutes = require('./admin.routes');

// Mount API v1 Sub-routers
router.use('/auth', authRoutes);
router.use('/patient', patientRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/doctors', doctorRoutes);
router.use('/bookings', bookingRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/bills', billRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/hospital-portal', hospitalPortalRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
