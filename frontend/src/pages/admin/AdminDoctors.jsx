import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Building2, 
  Star, 
  Award, 
  Clock, 
  DollarSign,
  UserCheck
} from 'lucide-react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import DoctorReviewModal from '../../components/admin/DoctorReviewModal';
import adminService from '../../services/adminService';

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'verified'
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDoctors = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const data = await adminService.getDoctors({
        status: activeTab === 'all' ? '' : activeTab,
        query: searchQuery
      });
      setDoctors(data);
    } catch (e) {
      console.error('Error loading doctors for admin:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleVerifyDoctor = async (doctorId) => {
    try {
      setActionLoading(true);
      await adminService.verifyDoctor(doctorId, 'verified');
      setSelectedDoctor(null);
      await loadDoctors(true);
    } catch (e) {
      console.error('Verify doctor error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeDoctor = async (doctorId) => {
    try {
      setActionLoading(true);
      await adminService.verifyDoctor(doctorId, 'pending');
      setSelectedDoctor(null);
      await loadDoctors(true);
    } catch (e) {
      console.error('Revoke doctor error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (doctorId, isActive) => {
    try {
      setActionLoading(true);
      await adminService.toggleDoctorStatus(doctorId, isActive);
      setSelectedDoctor(null);
      await loadDoctors(true);
    } catch (e) {
      console.error('Toggle doctor status error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout onRefresh={() => loadDoctors(true)} isRefreshing={refreshing}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Doctor Credential Registry & Medical Council Oversight</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Verify National Medical Commission (NMC/MCI) council IDs, qualifications, hospital departments, and OPD tariffs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
              Total Specialists: <strong className="text-blue-600">{doctors.length}</strong>
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Specialists ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Verification
            </button>
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'verified' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified Only
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor, specialty, NMC ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

        </div>

        {/* Doctors Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/80 tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Doctor Specialist</th>
                  <th className="py-3.5 px-5">Hospital & Dept</th>
                  <th className="py-3.5 px-5">NMC / MCI Registration</th>
                  <th className="py-3.5 px-5">Fee / Experience</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">
                      Loading doctor registry from Supabase PostgreSQL...
                    </td>
                  </tr>
                ) : doctors.length > 0 ? (
                  doctors.map((d) => {
                    const isVerified = d.verification_status === 'verified';

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center flex-shrink-0 overflow-hidden font-bold shadow-2xs">
                              {d.image_url ? (
                                <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                              ) : (
                                d.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block truncate">
                                {d.name}
                              </span>
                              <span className="text-[11px] text-blue-600 font-semibold">
                                {d.specialization}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 block truncate">
                              {d.hospitals?.name || 'Affiliated Hospital'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {d.departments?.name || 'General OPD'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono text-slate-700 font-medium">
                          {d.registration_number || 'MCI-REG-84920'}
                        </td>

                        <td className="py-4 px-5">
                          <div>
                            <span className="font-bold text-emerald-600 font-mono">₹{d.consultation_fee || 800}</span>
                            <span className="text-[10px] text-slate-500 block">{d.experience_years ? `${d.experience_years} yrs exp` : '10+ yrs'}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVerified 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {d.verification_status || 'pending'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedDoctor(d)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>

                            {!isVerified && (
                              <button
                                onClick={() => handleVerifyDoctor(d.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Verify</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No doctors match your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Doctor Review Modal */}
      <DoctorReviewModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        doctor={selectedDoctor}
        onVerify={handleVerifyDoctor}
        onRevoke={handleRevokeDoctor}
        onToggleStatus={handleToggleStatus}
        processing={actionLoading}
      />
    </AdminLayout>
  );
}
