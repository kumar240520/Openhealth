import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LandingPage from '../pages/public/LandingPage';
import SignUp from '../pages/auth/SignUp';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientOnboardingWizard from '../pages/patient/PatientOnboardingWizard';
import HospitalMarketplace from '../pages/patient/HospitalMarketplace';
import HospitalDetails from '../pages/patient/HospitalDetails';
import DoctorMarketplace from '../pages/patient/DoctorMarketplace';
import DoctorDetails from '../pages/patient/DoctorDetails';
import HospitalDashboard from '../pages/hospital/HospitalDashboard';
import HospitalOnboardingWizard from '../pages/hospital/HospitalOnboardingWizard';
import HospitalProfile from '../pages/hospital/HospitalProfile';
import HospitalBeds from '../pages/hospital/HospitalBeds';
import HospitalDoctors from '../pages/hospital/HospitalDoctors';
import HospitalDepartments from '../pages/hospital/HospitalDepartments';
import HospitalTreatments from '../pages/hospital/HospitalTreatments';
import HospitalPackages from '../pages/hospital/HospitalPackages';
import HospitalBookings from '../pages/hospital/HospitalBookings';
import HospitalAppointments from '../pages/hospital/HospitalAppointments';
import HospitalAnalytics from '../pages/hospital/HospitalAnalytics';
import HospitalTransparency from '../pages/hospital/HospitalTransparency';
import HospitalSettings from '../pages/hospital/HospitalSettings';
import { HospitalProvider } from '../context/HospitalContext';
import ProviderDashboard from '../pages/provider/ProviderDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminHospitals from '../pages/admin/AdminHospitals';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminVerification from '../pages/admin/AdminVerification';
import AdminSchemes from '../pages/admin/AdminSchemes';
import AdminInsurance from '../pages/admin/AdminInsurance';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';
import PatientFeaturePage from '../pages/patient/PatientFeaturePage';
import PatientBookings from '../pages/patient/PatientBookings';
import PatientEmergency from '../pages/patient/PatientEmergency';
import PatientDocuments from '../pages/patient/PatientDocuments';
import PatientBills from '../pages/patient/PatientBills';
import PatientReports from '../pages/patient/PatientReports';
import PatientAIAnalyzer from '../pages/patient/PatientAIAnalyzer';
import PatientSaved from '../pages/patient/PatientSaved';
import PatientProfile from '../pages/patient/PatientProfile';
import PatientSettings from '../pages/patient/PatientSettings';

function AuthLandingWrapper() {
  const navigate = useNavigate();

  const handleOpenAuth = (mode) => {
    if (mode === 'signup') navigate('/signup');
    else if (mode === 'forgot-password') navigate('/forgot-password');
    else navigate('/login');
  };

  return <LandingPage onOpenAuth={handleOpenAuth} />;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AuthLandingWrapper />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Hospital Marketplace & Discovery Suite */}
            <Route path="/app/hospitals" element={<HospitalMarketplace />} />
            <Route path="/app/hospitals/:id" element={<HospitalDetails />} />
            <Route path="/hospitals/:id" element={<HospitalDetails />} />
            <Route path="/app/search" element={<HospitalMarketplace />} />
            <Route path="/hospitals" element={<HospitalMarketplace />} />

            {/* Doctor Marketplace & Clinical Profile Suite (Phase 3) */}
            <Route path="/app/doctors" element={<DoctorMarketplace />} />
            <Route path="/doctors" element={<DoctorMarketplace />} />
            <Route path="/app/doctors/:id" element={<DoctorDetails />} />
            <Route path="/doctors/:id" element={<DoctorDetails />} />

            {/* Patient App Navigation Suite */}
            <Route path="/app/emergency" element={<PatientEmergency />} />
            <Route path="/app/ai-analyzer" element={<PatientAIAnalyzer />} />
            <Route path="/app/documents" element={<Navigate to="/app/reports" replace />} />
            <Route path="/app/schemes" element={<PatientFeaturePage type="schemes" />} />
            <Route path="/app/bills" element={<PatientBills />} />
            <Route path="/app/reports" element={<PatientReports />} />
            <Route path="/app/bookings" element={<PatientBookings />} />
            <Route path="/app/saved" element={<PatientSaved />} />
            <Route path="/app/settings" element={<PatientSettings />} />
            <Route path="/app/profile" element={<PatientProfile />} />

            {/* Hospital Module (Operations & Admin Portal Suite - 10 Pages) */}
            <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
            <Route 
              path="/hospital/onboarding" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalOnboardingWizard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/profile" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/beds" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalBeds />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/doctors" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalDoctors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/departments" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalDepartments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/treatments" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalTreatments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/packages" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalPackages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/bookings" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/appointments" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalAppointments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/analytics" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/transparency" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalTransparency />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hospital/settings" 
              element={
                <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
                  <HospitalSettings />
                </ProtectedRoute>
              } 
            />

            {/* Patient Onboarding Wizard (Protected) */}
            <Route 
              path="/patient/onboarding" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientOnboardingWizard />
                </ProtectedRoute>
              } 
            />

            {/* Role-Based Protected Routes */}
            <Route 
              path="/dashboard/patient" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/hospital" 
              element={<Navigate to="/hospital/dashboard" replace />}
            />
            <Route 
              path="/dashboard/provider" 
              element={
                <ProtectedRoute allowedRoles={['insurance_user', 'ambulance_driver']}>
                  <ProviderDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Platform Master Admin Portal Suite (9 Pages) */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/hospitals" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminHospitals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/doctors" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminDoctors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/verification" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminVerification />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/schemes" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminSchemes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/insurance" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminInsurance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/audit-logs" 
              element={
                <ProtectedRoute allowedRoles={['platform_admin']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all redirects back to home */}
            <Route path="*" element={<AuthLandingWrapper />} />
          </Routes>
        </BrowserRouter>
      </HospitalProvider>
    </AuthProvider>
  );
}
