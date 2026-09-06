import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Check, 
  X, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Bed, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Printer, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  Stethoscope, 
  ChevronDown, 
  QrCode, 
  HeartPulse, 
  LogOut, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import PatientQrAdmissionModal from '../../components/hospital/PatientQrAdmissionModal';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalBookings() {
  const { activeHospitalId, activeHospital } = useHospital();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary view: 'reservations' (incoming holds & bookings) vs 'admissions' (admitted inpatients)
  const [viewMode, setViewMode] = useState('reservations');
  const [activeTab, setActiveTab] = useState('Pending');
  const [data, setData] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [bedCategories, setBedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bedFilter, setBedFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync with URL query param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
      if (q.trim()) {
        setActiveTab('All');
      }
    }
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('q', val.trim());
      setActiveTab('All');
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams, { replace: true });
  };

  // QR Admission Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalBooking, setQrModalBooking] = useState(null);

  // Reject Modal State
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('No beds available in requested category');

  // Discharge Modal State
  const [dischargeAdmission, setDischargeAdmission] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load bookings and active inpatient admissions
  const loadData = async () => {
    try {
      setLoading(true);
      const [res, admList, bedsRes] = await Promise.all([
        hospitalPortalService.getBookings(activeHospitalId, activeTab),
        hospitalPortalService.getAdmissions(activeHospitalId),
        hospitalPortalService.getBeds(activeHospitalId).catch(() => ({ beds: [] }))
      ]);

      setData(res);
      setAdmissions(admList || []);
      setBedCategories(bedsRes.beds || []);

      if (res.bookings && res.bookings.length > 0) {
        setSelectedBooking(prev => {
          if (!prev) return res.bookings[0];
          const found = res.bookings.find(b => b.id === prev.id);
          return found || res.bookings[0];
        });
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      console.warn('Failed to load bookings & admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeHospitalId, activeTab]);

  // Realtime Supabase CDC listeners for bed_reservations, hospital_admissions, and hospital_beds
  useEffect(() => {
    if (!activeHospitalId) return;

    const channel = supabase
      .channel(`hospital-admissions-live-${activeHospitalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bed_reservations', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_admissions', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_beds', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId, activeTab]);

  // Decline/Reject Booking
  const handleRejectBooking = async () => {
    if (!rejectModalBooking) return;
    try {
      setActionLoading(true);
      await hospitalPortalService.updateBookingStatus(
        rejectModalBooking.id, 
        'cancelled', 
        `Declined by hospital: ${rejectReason}`
      );
      showToast(`Booking for ${rejectModalBooking.patientName} declined.`);
      setRejectModalBooking(null);
      await loadData();
    } catch (err) {
      showToast('Failed to update booking status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Discharge Admitted Patient
  const handleDischargePatient = async () => {
    if (!dischargeAdmission) return;
    try {
      setActionLoading(true);
      await hospitalPortalService.dischargePatient(dischargeAdmission.id);
      showToast(`Patient ${dischargeAdmission.patient_name} discharged successfully. Bed freed.`);
      setDischargeAdmission(null);
      await loadData();
    } catch (err) {
      showToast('Failed to discharge patient: ' + (err.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Bookings
  const filteredBookings = (data?.bookings || []).filter(b => {
    // When actively searching, search across all statuses so the requested code/patient is immediately found
    if (!searchQuery.trim()) {
      if (activeTab !== 'All' && b.status.toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }
      if (bedFilter !== 'all' && !b.bedType.toLowerCase().includes(bedFilter.toLowerCase())) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hspId = (activeHospitalId || '').toLowerCase();
      const hspCode = hspId ? `hsp-${hspId.slice(0, 8)}` : '';
      return (
        (b.id && b.id.toLowerCase().includes(q)) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.id && `bk-${b.id.slice(0, 8).toLowerCase()}`.includes(q)) ||
        (hspCode && (hspCode.includes(q) || q.includes('hsp'))) ||
        (b.patientName && b.patientName.toLowerCase().includes(q)) ||
        (b.doctorName && b.doctorName.toLowerCase().includes(q)) ||
        (b.doctor && b.doctor.toLowerCase().includes(q)) ||
        (b.department && b.department.toLowerCase().includes(q)) ||
        (b.bedType && b.bedType.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.abhaId && b.abhaId.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter Admissions
  const filteredAdmissions = admissions.filter(a => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hspId = (activeHospitalId || '').toLowerCase();
      const hspCode = hspId ? `hsp-${hspId.slice(0, 8)}` : '';
      return (
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.patient_name && a.patient_name.toLowerCase().includes(q)) ||
        (a.bed_number && a.bed_number.toLowerCase().includes(q)) ||
        (a.abha_id && a.abha_id.toLowerCase().includes(q)) ||
        (a.diagnosis && a.diagnosis.toLowerCase().includes(q)) ||
        (a.doctor_name && a.doctor_name.toLowerCase().includes(q)) ||
        (hspCode && (hspCode.includes(q) || q.includes('hsp')))
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'active':
      case 'admitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
      case 'discharged':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (viewMode === 'reservations') {
      const headers = 'ID,Booking Code,Patient Name,Bed Type,Admission Date,Status\n';
      const rows = filteredBookings.map(b => 
        `"${b.id}","${b.code}","${b.patientName}","${b.bedType}","${b.admissionDate}","${b.status}"`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hospital_Bookings_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } else {
      const headers = 'ID,Patient Name,Bed Number,Admission Date,Diagnosis,Status\n';
      const rows = filteredAdmissions.map(a => 
        `"${a.id}","${a.patient_name}","${a.bed_number}","${a.admission_date}","${a.diagnosis || ''}","${a.status}"`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hospital_Admissions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
  };

  const tabs = [
    { key: 'Pending', label: 'Pending Holds', count: data?.counts?.pending ?? 0, color: 'text-amber-600 bg-amber-50' },
    { key: 'Confirmed', label: 'Confirmed', count: data?.counts?.confirmed ?? 0, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'Cancelled', label: 'Cancelled', count: data?.counts?.cancelled ?? 0, color: 'text-rose-600 bg-rose-50' },
    { key: 'All', label: 'All Records', count: (data?.bookings || []).length, color: 'text-slate-600 bg-slate-100' },
  ];

  const activeAdmissionsCount = admissions.filter(a => a.status === 'admitted').length;

  return (
    <HospitalLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-slate-900">
                Bookings & QR Admission Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                CDC Live Synced
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage incoming patient bed reservations, perform instant QR intake, and supervise active inpatient admissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Primary Direct QR Intake Action */}
            <button
              onClick={() => {
                setQrModalBooking(null);
                setQrModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Patient QR / Direct Intake</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Reservations</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {data?.counts?.pending ?? 0}
            </div>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Awaiting QR triage / intake</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Confirmed Bookings</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {data?.counts?.confirmed ?? 0}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Verified & scheduled</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Inpatients</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Bed className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {activeAdmissionsCount}
            </div>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Currently occupied beds</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Configured Bed Types</span>
              <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {bedCategories.length || 6}
            </div>
            <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Live inventory synced</p>
          </div>
        </div>

        {/* Primary View Switcher: Reservations vs Admitted Inpatients */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setViewMode('reservations')}
            className={`pb-2 text-sm font-bold transition-all relative ${
              viewMode === 'reservations'
                ? 'text-teal-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Incoming Bed Reservations & Holds</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-800">
                {(data?.bookings || []).length}
              </span>
            </div>
            {viewMode === 'reservations' && (
              <motion.div layoutId="viewModeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
            )}
          </button>

          <button
            onClick={() => setViewMode('admissions')}
            className={`pb-2 text-sm font-bold transition-all relative ${
              viewMode === 'admissions'
                ? 'text-teal-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4" />
              <span>Active Inpatient Admissions</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                {activeAdmissionsCount}
              </span>
            </div>
            {viewMode === 'admissions' && (
              <motion.div layoutId="viewModeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
            )}
          </button>
        </div>

        {/* VIEW 1: RESERVATIONS & BOOKINGS */}
        {viewMode === 'reservations' && (
          <div className="space-y-4">
            {/* Secondary Sub-Tabs & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeTab === tab.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.key ? 'bg-white/20 text-white' : tab.color
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Bed Category Filter */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search BK-..., HSP-..., patient, doctor..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-60 sm:w-72"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={bedFilter}
                  onChange={(e) => setBedFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="all">All Bed Types</option>
                  <option value="icu">ICU Beds</option>
                  <option value="general">General Ward</option>
                  <option value="semi">Semi-Private</option>
                  <option value="deluxe">Deluxe Suite</option>
                </select>
              </div>
            </div>

            {/* Split Screen: Bookings List + Detailed Inspection Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Bookings Table / List */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                    <p className="text-xs font-semibold">Loading live bed reservations from database...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-3">
                    <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No {activeTab.toLowerCase()} bookings found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      There are currently no bed reservations matching this status filter. You can initiate a direct walk-in admission using the button above.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => {
                      const isSelected = selectedBooking?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`p-4 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isSelected ? 'bg-teal-50/50 border-l-4 border-l-teal-600' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                              {b.patientName.charAt(0)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-900">{b.patientName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(b.status)}`}>
                                  {b.status}
                                </span>
                                {b.isHeld && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Priority Hold ({b.drive_time || '15 mins'})
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="font-mono text-teal-700 font-semibold">{b.code}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-700 font-medium">
                                  <Bed className="w-3.5 h-3.5 text-slate-400" />
                                  {b.bedType}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {b.bookingDate}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons on Row */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {b.status.toLowerCase() === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQrModalBooking(b);
                                    setQrModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                  title="Scan Patient QR & Confirm Admission"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  Scan & Admit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectModalBooking(b);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                  title="Decline Booking"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
                              title="Inspect Details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Inspection Drawer */}
              <div className="lg:col-span-4">
                {selectedBooking ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-5 sticky top-24">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-mono text-teal-700 font-bold block">
                          {selectedBooking.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedBooking.patientName}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>

                    {/* Patient & Bed Summary */}
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Requested Bed</span>
                          <span className="font-bold text-slate-900">{selectedBooking.bedType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Department</span>
                          <span className="font-medium text-slate-700">{selectedBooking.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reservation Time</span>
                          <span className="font-medium text-slate-700">{selectedBooking.admissionDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hold Duration</span>
                          <span className="font-bold text-amber-700">{selectedBooking.duration}</span>
                        </div>
                      </div>

                      {/* Notes & Triage Telemetry */}
                      {selectedBooking.notes && (
                        <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs">
                          <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block mb-1">
                            Live Patient Dispatch Note
                          </span>
                          <p className="text-slate-700 leading-relaxed">
                            {selectedBooking.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Drawer Action Bar */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {selectedBooking.status.toLowerCase() === 'pending' ? (
                        <>
                          <button
                            onClick={() => {
                              setQrModalBooking(selectedBooking);
                              setQrModalOpen(true);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                          >
                            <QrCode className="w-4 h-4" />
                            Scan Patient QR & Confirm Admission
                          </button>
                          <button
                            onClick={() => setRejectModalBooking(selectedBooking)}
                            className="w-full py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Decline Reservation
                          </button>
                        </>
                      ) : (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                          <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Reservation {selectedBooking.status}
                          </p>
                          <p className="text-[11px] text-emerald-600 mt-0.5">Recorded in real database</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                    <User className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Select any booking row to inspect verified clinical details and actions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE INPATIENT ADMISSIONS */}
        {viewMode === 'admissions' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Currently Admitted Inpatients ({activeAdmissionsCount})
                </h3>
                <p className="text-xs text-slate-500">
                  Patients admitted to hospital beds via QR intake. Discharging atomically frees the allocated bed.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter inpatients by name, ABHA, bed..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-60"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                <p className="text-xs font-semibold">Loading inpatient census...</p>
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Bed className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No active inpatient admissions</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All hospital beds are currently available or reservations are pending. Use the "Scan Patient QR / Direct Intake" button to admit an arriving patient.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Bed / Unit</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Admission Date</th>
                      <th className="py-3 px-4">Diagnosis</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmissions.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <span className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold">
                            {adm.bed_number}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{adm.patient_name}</div>
                          <div className="text-[11px] font-sans text-emerald-700 flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>QR Verified Inpatient</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <HeartPulse className="w-3.5 h-3.5" />
                            {adm.blood_group || 'O+'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {new Date(adm.admission_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                          {adm.diagnosis || 'Inpatient Care'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(adm.status)}`}>
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {adm.status === 'admitted' && (
                            <button
                              onClick={() => setDischargeAdmission(adm)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                            >
                              <LogOut className="w-3 h-3 text-slate-500" />
                              Discharge
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: QR CODE ADMISSION & INTAKE */}
        {qrModalOpen && (
          <PatientQrAdmissionModal
            isOpen={qrModalOpen}
            onClose={() => {
              setQrModalOpen(false);
              setQrModalBooking(null);
            }}
            hospitalId={activeHospitalId}
            prefilledBooking={qrModalBooking}
            availableBedTypes={bedCategories}
            onAdmissionSuccess={(res) => {
              showToast(res.message || 'Patient admitted successfully!');
              loadData();
            }}
          />
        )}

        {/* MODAL 2: DECLINE BOOKING REASON */}
        <AnimatePresence>
          {rejectModalBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <XCircle className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Decline Reservation</h3>
                  </div>
                  <button onClick={() => setRejectModalBooking(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Provide a reason for declining admission for <strong className="text-slate-900">{rejectModalBooking.patientName}</strong>. The patient will be notified immediately.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Reason for Decline</label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="No beds available in requested category">No beds available in requested category</option>
                      <option value="Specialist consultant not on duty">Specialist consultant not on duty</option>
                      <option value="Emergency trauma rerouted to tertiary hub">Emergency trauma rerouted to tertiary hub</option>
                      <option value="Patient cancellation request received">Patient cancellation request received</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setRejectModalBooking(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectBooking}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors"
                  >
                    {actionLoading ? 'Declining...' : 'Decline Booking'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 3: DISCHARGE INPATIENT CONFIRMATION */}
        <AnimatePresence>
          {dischargeAdmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <LogOut className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Discharge Inpatient</h3>
                  </div>
                  <button onClick={() => setDischargeAdmission(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Are you ready to discharge <strong className="text-slate-900">{dischargeAdmission.patient_name}</strong> from unit <strong className="text-slate-900">{dischargeAdmission.bed_number}</strong>?
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                  <p>• Assigned Bed: <strong className="text-slate-900">{dischargeAdmission.bed_number}</strong></p>
                  <p>• Diagnosis: <strong className="text-slate-900">{dischargeAdmission.diagnosis || 'Inpatient Care'}</strong></p>
                  <p className="text-emerald-700 font-semibold pt-1">• Action: The allocated bed will immediately be marked as available in live inventory.</p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setDischargeAdmission(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDischargePatient}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors"
                  >
                    {actionLoading ? 'Discharging...' : 'Confirm Discharge & Free Bed'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </HospitalLayout>
  );
}
