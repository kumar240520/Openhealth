const express = require('express');
const router = express.Router();
const hospitalPortalController = require('../controllers/hospitalPortalController');

// 1. Dashboard Overview
router.get('/dashboard', hospitalPortalController.getDashboard);

// 2. Hospital Profile
router.get('/profile', hospitalPortalController.getProfile);
router.put('/profile', hospitalPortalController.updateProfile);
router.patch('/profile', hospitalPortalController.updateProfile);
router.post('/onboarding', hospitalPortalController.saveOnboarding);

// 3. Beds Inventory & Status Updates
router.get('/beds', hospitalPortalController.getBeds);
router.post('/beds', hospitalPortalController.saveBedCategory);
router.put('/beds/:id', hospitalPortalController.updateBed);
router.patch('/beds/:id', hospitalPortalController.updateBed);
router.delete('/beds/:id', hospitalPortalController.deleteBedCategory);

// 4. Doctors Specialist Roster
router.get('/doctors', hospitalPortalController.getDoctors);
router.post('/doctors', hospitalPortalController.createDoctor);
router.put('/doctors/:id', hospitalPortalController.updateDoctor);
router.patch('/doctors/:id', hospitalPortalController.updateDoctor);
router.patch('/doctors/:id/duty', hospitalPortalController.toggleDoctorDuty);
router.delete('/doctors/:id', hospitalPortalController.deleteDoctor);

// 5. Clinical Departments
router.get('/departments', hospitalPortalController.getDepartments);
router.post('/departments', hospitalPortalController.createDepartment);
router.put('/departments/:id', hospitalPortalController.updateDepartment);
router.patch('/departments/:id', hospitalPortalController.updateDepartment);
router.delete('/departments/:id', hospitalPortalController.deleteDepartment);

// 6. Treatments & Procedures
router.get('/treatments', hospitalPortalController.getTreatments);
router.post('/treatments', hospitalPortalController.createTreatment);
router.put('/treatments/:id', hospitalPortalController.updateTreatment);
router.patch('/treatments/:id', hospitalPortalController.updateTreatment);
router.patch('/treatments/:id/toggle', hospitalPortalController.toggleTreatmentAvailability);
router.delete('/treatments/:id', hospitalPortalController.deleteTreatment);

// 7. Fixed Price Packages
router.get('/packages', hospitalPortalController.getPackages);
router.post('/packages', hospitalPortalController.createPackage);
router.put('/packages/:id', hospitalPortalController.updatePackage);
router.patch('/packages/:id', hospitalPortalController.updatePackage);
router.patch('/packages/:id/toggle', hospitalPortalController.togglePackageActive);
router.delete('/packages/:id', hospitalPortalController.deletePackage);

// 8. Bookings & Admission Queue (Bed Reservations & Inpatient Admissions)
router.get('/bookings', hospitalPortalController.getBookings);
router.patch('/bookings/:id/status', hospitalPortalController.updateBookingStatus);
router.post('/admit', hospitalPortalController.admitPatient);
router.get('/admissions', hospitalPortalController.getAdmissions);
router.patch('/admissions/:id/discharge', hospitalPortalController.dischargePatient);

// 8b. Doctor OPD Appointments & Consultations
router.get('/appointments', hospitalPortalController.getAppointments);
router.post('/appointments/confirm-qr', hospitalPortalController.confirmAppointmentQr);
router.post('/appointments/complete-qr', hospitalPortalController.completeAppointmentQr);
router.patch('/appointments/:id/status', hospitalPortalController.updateAppointmentStatus);

// 9. Analytics & Operational Intelligence
router.get('/analytics', hospitalPortalController.getAnalytics);

// 10. Transparency Scorecard
router.get('/transparency', hospitalPortalController.getTransparency);
router.post('/transparency/recalculate', hospitalPortalController.recalculateTransparency);

module.exports = router;
