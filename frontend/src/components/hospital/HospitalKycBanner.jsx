import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export default function HospitalKycBanner({ onOpenKyc }) {
  const { activeHospital } = useHospital();

  // If already verified, vanish completely!
  const isVerified = activeHospital?.kyc_status === 'verified' || 
                     activeHospital?.kyc_status === 'approved' || 
                     activeHospital?.verification_status === 'verified';

  if (!activeHospital || isVerified) {
    return null;
  }

  const isSubmitted = activeHospital.kyc_status === 'submitted' || 
                      activeHospital.kyc_status === 'in_review' || 
                      activeHospital.verification_status === 'submitted' ||
                      activeHospital.verification_status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 p-4 sm:p-4.5 backdrop-blur-sm shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-300/60">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                {isSubmitted ? 'KYC Verification Under Review' : 'Action Required: Complete Hospital KYC'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                {isSubmitted ? 'Under Review' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-2xl leading-relaxed">
              {isSubmitted 
                ? 'Your clinical establishment license has been submitted and is currently being validated by the OpenHealth Standards Board.'
                : 'Upload your Clinical Establishment License and statutory documents to unlock premier marketplace badges, instant patient admission verification, and NABH Gold certification.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenKyc}
          className="self-start sm:self-auto shrink-0 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSubmitted ? 'Update KYC Details' : 'Complete your KYC'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
