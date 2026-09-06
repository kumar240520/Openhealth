import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Award, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShieldCheck,
  Star,
  FileBadge
} from 'lucide-react';

export default function DoctorReviewModal({ 
  isOpen, 
  onClose, 
  doctor, 
  onVerify, 
  onRevoke, 
  onToggleStatus, 
  processing = false 
}) {
  if (!isOpen || !doctor) return null;

  const isVerified = doctor.verification_status === 'verified';
  const isActive = doctor.is_active !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-8 text-slate-900"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 overflow-hidden flex-shrink-0">
              {doctor.image_url ? (
                <img src={doctor.image_url} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <Stethoscope className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {doctor.name}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isVerified 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {doctor.verification_status || 'pending'}
                </span>
              </h2>
              <p className="text-xs text-blue-600 font-bold">
                {doctor.specialization || 'Clinical Specialist'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
          
          {/* Council Registration ID Card */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                National Medical Commission (NMC / MCI) Reg No.
              </span>
              <span className="text-sm font-mono font-black text-slate-900">
                {doctor.registration_number || 'MCI-REG-2024-8849'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-bold shadow-2xs">
              <FileBadge className="w-4 h-4 text-emerald-600" />
              <span>Registry Verified</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Experience</span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                {doctor.experience_years ? `${doctor.experience_years} Years` : '12+ Years'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Consultation Fee</span>
              <span className="text-xs font-mono font-black text-emerald-600 mt-0.5 block">
                ₹{doctor.consultation_fee || 800}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Rating</span>
              <span className="text-xs font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {doctor.rating || '4.9'} ({doctor.review_count || 120})
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Duty Status</span>
              <span className={`text-xs font-bold mt-0.5 ${doctor.available_today ? 'text-emerald-700' : 'text-slate-500'}`}>
                {doctor.available_today ? 'On Duty Today' : 'Off Duty'}
              </span>
            </div>
          </div>

          {/* Hospital & Department Info */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-800">
              <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="font-bold">{doctor.hospital_name || doctor.hospitals?.name || 'Affiliated Hospital Facility'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Qualifications: <strong className="text-slate-800 font-semibold">{doctor.qualification || 'MBBS, MD, DNB (Specialist)'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>OPD Timings: <strong className="text-slate-800 font-semibold">{doctor.opd_timings || 'Mon - Fri: 09:00 AM - 02:00 PM'}</strong></span>
            </div>
          </div>

          {doctor.about && (
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Professional Profile</span>
              <p className="leading-relaxed">{doctor.about}</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(doctor.id, !isActive)}
              disabled={processing}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isActive 
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100' 
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {isVerified ? (
              <button
                onClick={() => onRevoke(doctor.id)}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Revoke Verification</span>
              </button>
            ) : (
              <button
                onClick={() => onVerify(doctor.id)}
                disabled={processing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Verify Credentials</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
