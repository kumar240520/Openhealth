import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { Activity } from 'lucide-react';

export function getRoleDashboardPath(role, profile, activeHospital) {
  switch (role) {
    case 'hospital_admin':
    case 'hospital_staff':
      if (activeHospital && activeHospital.onboarding_completed === false) {
        return '/hospital/onboarding';
      }
      if (profile && profile.onboarding_completed === false) {
        return '/hospital/onboarding';
      }
      if (profile && profile.onboarding_completed === true && activeHospital && activeHospital.onboarding_completed === true) {
        return '/hospital/dashboard';
      }
      // If onboarding status is not explicitly verified completed, default to hospital onboarding
      return '/hospital/onboarding';
    case 'insurance_user':
    case 'ambulance_driver':
      return '/dashboard/provider';
    case 'platform_admin':
      return '/admin/dashboard';
    case 'patient':
    default:
      if (profile && profile.onboarding_completed === false) {
        return '/patient/onboarding';
      }
      return '/dashboard/patient';
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const hospitalContext = useHospital();
  const activeHospital = hospitalContext?.activeHospital;
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center gap-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center animate-pulse">
            <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-xl animate-pulse" />
        </div>
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
          Authenticating OpenHealth RBAC...
        </p>
      </div>
    );
  }

  // If unauthenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const metadataRole = user?.user_metadata?.role;
  const profileRole = profile?.role;

  // Hospital role takes precedence if either profile or user metadata indicates hospital affiliation
  const isHospitalRole = profileRole === 'hospital_admin' || 
                         profileRole === 'hospital_staff' || 
                         metadataRole === 'hospital_admin' || 
                         metadataRole === 'hospital_staff';

  const isPlatformAdmin = profileRole === 'platform_admin' || metadataRole === 'platform_admin';
  const isProvider = profileRole === 'insurance_user' || metadataRole === 'insurance_user' || 
                     profileRole === 'ambulance_driver' || metadataRole === 'ambulance_driver';

  const userRole = isHospitalRole 
    ? (profileRole === 'hospital_staff' || metadataRole === 'hospital_staff' ? 'hospital_staff' : 'hospital_admin')
    : isPlatformAdmin 
    ? 'platform_admin'
    : isProvider 
    ? (profileRole || metadataRole)
    : (profileRole || metadataRole || 'patient');

  const isHospitalUser = userRole === 'hospital_admin' || userRole === 'hospital_staff';

  // If route has specific allowed roles and current user is not authorized
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const targetPath = getRoleDashboardPath(userRole, profile, activeHospital);
    return <Navigate to={targetPath} replace />;
  }

  // If patient has not completed onboarding and is trying to access dashboard
  if (userRole === 'patient' && profile && profile.onboarding_completed === false && location.pathname.startsWith('/dashboard/patient')) {
    return <Navigate to="/patient/onboarding" replace />;
  }

  // If hospital admin/staff has not completed onboarding and is trying to access hospital dashboard
  if (isHospitalUser) {
    const isOnboardingDone = activeHospital?.onboarding_completed === true && profile?.onboarding_completed === true;
    
    // Intercept and redirect to onboarding if incomplete
    if (!isOnboardingDone && location.pathname !== '/hospital/onboarding') {
      return <Navigate to="/hospital/onboarding" replace />;
    }

    // If onboarding is already completed, prevent getting stuck on onboarding page
    if (isOnboardingDone && location.pathname === '/hospital/onboarding') {
      return <Navigate to="/hospital/dashboard" replace />;
    }
  }

  return children;
}

