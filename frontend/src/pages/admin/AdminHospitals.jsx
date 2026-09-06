import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  BedDouble, 
  Siren, 
  ExternalLink,
  RotateCw,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import HospitalReviewModal from '../../components/admin/HospitalReviewModal';
import adminService from '../../services/adminService';

export default function AdminHospitals() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('all'); // 'pending' | 'verified' | 'all'
  const [cityFilter, setCityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadHospitals = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const data = await adminService.getHospitals({
        status: activeTab === 'all' ? '' : activeTab,
        city: cityFilter === 'all' ? '' : cityFilter,
        query: searchQuery
      });
      setHospitals(data);
    } catch (e) {
      console.error('Error loading hospitals for admin:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, cityFilter, searchQuery]);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const handleApprove = async (hospitalId) => {
    try {
      setActionLoading(true);
      await adminService.verifyHospital(hospitalId, 'verified', 'Approved by Platform Master Admin');
      setSelectedHospital(null);
      await loadHospitals(true);
    } catch (e) {
      console.error('Approve error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (hospitalId, reason) => {
    try {
      setActionLoading(true);
      await adminService.verifyHospital(hospitalId, 'rejected', reason);
      setSelectedHospital(null);
      await loadHospitals(true);
    } catch (e) {
      console.error('Reject error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async (hospitalId, isActive) => {
    try {
      setActionLoading(true);
      await adminService.toggleHospitalStatus(hospitalId, isActive);
      setSelectedHospital(null);
      await loadHospitals(true);
    } catch (e) {
      console.error('Toggle suspend error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = hospitals.filter(h => h.verification_status !== 'verified').length;

  return (
    <AdminLayout onRefresh={() => loadHospitals(true)} isRefreshing={refreshing}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Hospital Node Directory & Compliance</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Verify Clinical Establishment licenses, review NABH accreditations, and govern marketplace active statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 shadow-2xs">
              Pending Approvals: <strong>{pendingCount}</strong>
            </span>
          </div>
        </div>

        {/* Tabs & Filters Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Facilities ({hospitals.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Queue
            </button>
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'verified' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified Network
            </button>
          </div>

          {/* Search & City Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, city, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Cities</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Indore">Indore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

        </div>

        {/* Hospitals Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 animate-pulse">
              Querying hospital registry from Supabase PostgreSQL...
            </div>
          ) : hospitals.length > 0 ? (
            hospitals.map((h) => {
              const isVerified = h.verification_status === 'verified';
              const isPending = h.verification_status !== 'verified' && h.verification_status !== 'rejected';
              const totalBeds = (h.hospital_beds || []).reduce((acc, b) => acc + (b.total_beds || 0), 0) || 120;

              return (
                <motion.div
                  key={h.id}
                  whileHover={{ translateY: -2 }}
                  className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isVerified 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {h.verification_status || 'pending'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight mt-1.5 truncate">
                          {h.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{h.city || 'Bangalore'}, {h.state || 'Karnataka'}</span>
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>

                    {/* License & Metric Pills */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>License Reg:</span>
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
                        <span className="font-medium text-slate-800 truncate max-w-[150px]">
                          {h.signatory_name || 'Not Specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>KYC Documents:</span>
                        <span className={`font-bold ${h.kyc_document_url ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {h.kyc_document_url ? 'Attached' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Trauma / Bed Cap:</span>
                        <span className="text-slate-800 font-semibold">{totalBeds} Beds • {h.emergency_available ? 'Level 1 Trauma' : 'General'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedHospital(h)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Review Docs
                    </button>

                    {!isVerified ? (
                      <button
                        onClick={() => handleApprove(h.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve Node</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Active
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-xs text-slate-500">
              No hospital facilities found matching your search.
            </div>
          )}
        </div>

      </div>

      {/* Hospital Review & KYC Modal */}
      <HospitalReviewModal
        isOpen={!!selectedHospital}
        onClose={() => setSelectedHospital(null)}
        hospital={selectedHospital}
        onApprove={handleApprove}
        onReject={handleReject}
        onToggleSuspend={handleToggleSuspend}
        processing={actionLoading}
      />
    </AdminLayout>
  );
}
