const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Guard all admin routes with authentication and platform_admin role
router.use(requireAuth);
router.use(requireRole('platform_admin'));

// 1. Dashboard Overview & Realtime KPIs
router.get('/dashboard', adminController.getDashboard);

// 2. User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/status', adminController.updateUserStatus);

// 3. Hospital Node Management & Verification
router.get('/hospitals', adminController.getHospitals);
router.get('/hospitals/:id', adminController.getHospitalById);
router.patch('/hospitals/:id/verify', adminController.verifyHospital);
router.patch('/hospitals/:id/status', adminController.toggleHospitalStatus);

// 4. Doctor Management & Credential Verification
router.get('/doctors', adminController.getDoctors);
router.patch('/doctors/:id/verify', adminController.verifyDoctor);
router.patch('/doctors/:id/status', adminController.toggleDoctorStatus);

// 5. Government Schemes
router.get('/schemes', adminController.getSchemes);
router.post('/schemes', adminController.createScheme);
router.put('/schemes/:id', adminController.updateScheme);
router.patch('/schemes/:id/toggle', adminController.toggleSchemeStatus);
router.delete('/schemes/:id', adminController.deleteScheme);

// 6. Insurance & TPA Providers
router.get('/insurance', adminController.getInsurance);
router.post('/insurance', adminController.createInsurance);
router.put('/insurance/:id', adminController.updateInsurance);
router.patch('/insurance/:id/toggle', adminController.toggleInsurance);
router.delete('/insurance/:id', adminController.deleteInsurance);

// 7. Platform Analytics
router.get('/analytics', adminController.getAnalytics);

// 8. Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/audit-logs', adminController.logAuditEvent);

module.exports = router;
