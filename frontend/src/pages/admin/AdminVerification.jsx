import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Building2, 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  RotateCw,
  Sparkles,
  ShieldAlert,
  FileCheck2
} from 'lucide-react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import HospitalReviewModal from '../../components/admin/HospitalReviewModal';
import DoctorReviewModal from '../../components/admin/DoctorReviewModal';
import adminService from '../../services/adminService';

export default function AdminVerification() {
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeQueue, setActiveQueue] = useState('hospitals'); // 'hospitals' | 'doctors'

  // Modal inspection
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadQueues = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [hospData, docData] = await Promise.all([
        adminService.getHospitals({ status: 'pending' }),
        adminService.getDoctors({ status: 'pending' })
      ]);

      setPendingHospitals(hospData);
      setPendingDoctors(docData);
    } catch (e) {
      console.error('Error loading verification queue:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQueues();
  }, [loadQueues]);

  const handleApproveHospital = async (hospitalId) => {
    try {
      setActionLoading(true);
      await adminService.verifyHospital(hospitalId, 'verified', 'Approved through Verification Command Center');
      setSelectedHospital(null);
      await loadQueues(true);
    } catch (e) {
      console.error('Approve hospital error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectHospital = async (hospitalId, reason) => {
    try {
      setActionLoading(true);
      await adminService.verifyHospital(hospitalId, 'rejected', reason || 'License verification rejected by Platform Admin');
      setSelectedHospital(null);
      await loadQueues(true);
    } catch (e) {
      console.error('Reject hospital error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      setActionLoading(true);
      await adminService.verifyDoctor(doctorId, 'verified');
      setSelectedDoctor(null);
      await loadQueues(true);
    } catch (e) {
      console.error('Verify doctor error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout onRefresh={() => loadQueues(true)} isRefreshing={refreshing}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>National Healthcare Node Verification Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Active regulatory compliance pipeline for approving hospital facilities and medical council doctor registrations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 shadow-2xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Action: {pendingHospitals.length + pendingDoctors.length}</span>
            </span>
          </div>
        </div>

        {/* Queue Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setActiveQueue('hospitals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeQueue === 'hospitals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital Nodes Queue ({pendingHospitals.length})</span>
          </button>

          <button
            onClick={() => setActiveQueue('doctors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeQueue === 'doctors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Credentials Queue ({pendingDoctors.length})</span>
          </button>
        </div>

        {/* QUEUE CONTENT */}
        {activeQueue === 'hospitals' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
                Querying pending hospital submissions from Supabase...
              </div>
            ) : pendingHospitals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingHospitals.map((h) => (
                  <div 
                    key={h.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase">
                            Awaiting License Review
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            h.kyc_document_url ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {h.kyc_document_url ? 'KYC Docs: Submitted' : 'KYC Docs: Missing'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">{h.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {[h.city, h.state].filter(Boolean).join(', ') || 'Location Not Specified'}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Clinical License:</span>
                        <span className={`font-mono font-bold ${h.license_number ? 'text-slate-900' : 'text-amber-600'}`}>
                          {h.license_number || 'Not Provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>GSTIN / Tax ID:</span>
                        <span className={`font-mono font-bold ${h.tax_id ? 'text-slate-900' : 'text-amber-600'}`}>
                          {h.tax_id || 'Not Provided'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Signatory:</span>
                        <span className="text-slate-800 font-medium truncate max-w-[180px]">
                          {h.signatory_name || 'Not Specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Submitted:</span>
                        <span className="text-slate-800 font-medium">
                          {h.created_at ? new Date(h.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {h.kyc_document_url && (
                          <a
                            href={h.kyc_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Preview Attached KYC Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Doc</span>
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedHospital(h)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Inspect KYC
                        </button>
                      </div>

                      <button
                        onClick={() => handleApproveHospital(h.id)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Hospitals Pending Verification</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Every registered hospital node is currently active and compliant with National Health Authority regulations.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
                Querying pending doctor registrations from Supabase...
              </div>
            ) : pendingDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingDoctors.map((d) => (
                  <div 
                    key={d.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold uppercase">
                          Awaiting Council Check
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">{d.name}</h3>
                        <p className="text-xs text-blue-600 font-bold">{d.specialization}</p>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>NMC Registration:</span>
                        <span className="font-mono text-slate-900 font-bold">{d.registration_number || 'NMC-PENDING'}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Hospital:</span>
                        <span className="text-slate-800 font-medium">{d.hospitals?.name || 'Facility Assigned'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedDoctor(d)}
                        className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleVerifyDoctor(d.id)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verify Credentials</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">All Doctor Credentials Verified</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All active clinician profiles match medical council databases with verified practitioner licenses.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      <HospitalReviewModal
        isOpen={!!selectedHospital}
        onClose={() => setSelectedHospital(null)}
        hospital={selectedHospital}
        onApprove={handleApproveHospital}
        onReject={handleRejectHospital}
        processing={actionLoading}
      />

      <DoctorReviewModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        doctor={selectedDoctor}
        onVerify={handleVerifyDoctor}
        processing={actionLoading}
      />
    </AdminLayout>
  );
}
