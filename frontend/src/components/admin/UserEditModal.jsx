import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, ShieldCheck, Check, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function UserEditModal({ isOpen, onClose, user, onSave, processing = false }) {
  const [role, setRole] = useState(user?.role || 'patient');
  const [isActive, setIsActive] = useState(user?.is_active !== false);

  if (!isOpen || !user) return null;

  const roleOptions = [
    { value: 'patient', label: 'Patient', desc: 'Standard consumer account with access to health vault & booking' },
    { value: 'hospital_staff', label: 'Hospital Staff', desc: 'Operational hospital portal permissions for bed and appointment updates' },
    { value: 'hospital_admin', label: 'Hospital Administrator', desc: 'Full operational control over hospital facility profile, staff, and pricing' },
    { value: 'ambulance_driver', label: 'Emergency Responder / Driver', desc: 'Access to ambulance telemetry and 1-tap SOS dispatch tracking' },
    { value: 'insurance_user', label: 'Insurance / TPA Manager', desc: 'Policy verification and cashless authorization desk' },
    { value: 'platform_admin', label: 'Platform Master Admin', desc: 'Full national healthcare node governance, hospital approvals, and audit access' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        userId: user.id,
        role,
        is_active: isActive
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-8 text-slate-900"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Manage User Role & Privileges</h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">{user.email}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* User info box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Full Name:</span>
              <span className="font-bold text-slate-900">{user.full_name || 'Anonymous User'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>User UUID:</span>
              <span className="font-mono text-slate-700 font-medium text-[10px]">{user.id}</span>
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Assigned Platform Role
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {roleOptions.map((opt) => (
                <label 
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    role === opt.value 
                      ? 'bg-blue-50 border-blue-300 text-slate-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <span className="font-bold block text-xs">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Account Status Switch */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Account Status</span>
              <span className="text-[11px] text-slate-500">
                {isActive ? 'User can log in and access allowed platform features' : 'Access suspended; user cannot sign in'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isActive ? 'Active' : 'Suspended'}
            </button>
          </div>

          {role === 'platform_admin' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span className="text-[11px] font-medium">Granting platform master admin access provides full governance and audit access.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Privileges</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
