import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';

export function getRoleDashboardPath(role, profile) {
  switch (role) {
    case 'hospital_admin':
    case 'hospital_staff':
      return '/dashboard/hospital';
    case 'insurance_user':
    case 'ambulance_driver':
      return '/dashboard/provider';
    case 'platform_admin':
      return '/dashboard/admin';
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

  const userRole = profile?.role || 'patient';

  // If route has specific allowed roles and current user is not authorized
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const targetPath = getRoleDashboardPath(userRole, profile);
    return <Navigate to={targetPath} replace />;
  }

  // If patient has not completed onboarding and is trying to access dashboard
  if (userRole === 'patient' && profile && profile.onboarding_completed === false && location.pathname.startsWith('/dashboard/patient')) {
    return <Navigate to="/patient/onboarding" replace />;
  }

  return children;
}
