import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Building2, 
  LogOut, 
  FileText,
  Activity,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function HospitalVerificationLockOverlay({ hospital, onRefresh }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const [checking, setChecking] = useState(false);
  const [celebratingUnlock, setCelebratingUnlock] = useState(false);
  const [visible, setVisible] = useState(true);

  const isVerified = hospital?.verification_status === 'verified';
  const isRejected = hospital?.verification_status === 'rejected';
  const isPending = !isVerified && !isRejected;

  // Watch for real-time verification approval change
  useEffect(() => {
    if (isVerified) {
      setCelebratingUnlock(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [isVerified]);

  const handleManualCheck = async () => {
    try {
      setChecking(true);
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.error('Status check error:', e);
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  const handleLogout = async () => {
    try {
      if (signOut) await signOut();
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center gap-5 my-auto"
        >
          {/* Celebrating Unlock Screen */}
          {celebratingUnlock ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider">
                  Verification Approved!
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                  Hospital Facility Unlocked
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
                  The Platform Administrator has approved {hospital?.name || 'your facility'}. You now have complete access to the operations dashboard.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-4 py-2 rounded-xl">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Removing lock & launching dashboard...</span>
              </div>
            </motion.div>
          ) : isRejected ? (
            /* Rejected State */
            <>
              <div className="w-18 h-18 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Approval Rejected</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Verification Not Approved
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                  The Platform Administration has flagged compliance or licensing issues with your registration.
                </p>
              </div>

              {/* Rejection reason box */}
              <div className="w-full p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 text-left text-xs space-y-1.5">
                <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px] block">
                  Administrator Review Notes:
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {hospital?.verification_notes || 'Regulatory license or KYC documents require correction before approval.'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 w-full justify-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/hospital/onboarding')}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Review & Update Onboarding</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            /* Pending Approval Lock State */
            <>
              {/* Animated Glowing Lock Symbol */}
              <div className="relative">
                <div className="w-18 h-18 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Lock className="w-9 h-9 stroke-[2.2]" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 animate-ping opacity-75" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white" />
              </div>

              {/* Heading & Status Badges */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Approval Required • In Review</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Facility Verification in Progress
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                  Your onboarding submission for <strong className="text-slate-800">{hospital?.name || 'this facility'}</strong> has been sent to the Platform Admin Verification Queue.
                </p>
              </div>

              {/* Progress Tracker Card */}
              <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">{hospital?.name || 'Hospital Node'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {hospital?.city || 'Indore'}, {hospital?.state || 'MP'}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Step 1 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                      <span>Onboarding & Bed Allocation</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Completed
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                      <span>Regulatory License & KYC</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                      {hospital?.license_number || 'Submitted'}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>Platform Admin Authorization</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold animate-pulse">
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time sync banner */}
              <div className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 text-left">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                <span className="leading-snug">
                  <strong>Live Synchronization Active:</strong> When the Platform Administrator clicks <em>"Approve Facility"</em> in the admin panel, this lock will automatically disappear.
                </span>
              </div>

              {/* Actions: Check Status & Sign Out */}
              <div className="flex items-center gap-3 w-full justify-between pt-1">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-70"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  <span>{checking ? 'Checking Status...' : 'Check Approval Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
