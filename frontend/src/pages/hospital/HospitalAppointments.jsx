import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarClock, 
  Search, 
  Filter, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  User, 
  Stethoscope, 
  ChevronRight, 
  RefreshCw, 
  Layers, 
  Phone, 
  Video, 
  Building2, 
  CreditCard, 
  Sparkles,
  Check,
  Calendar,
  CalendarDays
} from 'lucide-react';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import DoctorAppointmentQrModal from '../../components/hospital/DoctorAppointmentQrModal';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalAppointments() {
  const { activeHospitalId, activeHospital } = useHospital();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  // Default tab is 'Scheduled' (Today's Scheduled Consultations)
  const [activeTab, setActiveTab] = useState('Scheduled'); // 'Scheduled', 'Confirmed', 'Completed', 'Upcoming', 'All'
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalMode, setQrModalMode] = useState('complete'); // 'complete' or 'check_in'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load appointments data
  const loadData = async () => {
    if (!activeHospitalId) return;
    try {
      setLoading(true);
      const todayDateStr = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();

      const res = await hospitalPortalService.getAppointments(activeHospitalId, {
        status: activeTab,
        doctorId: selectedDoctorId,
        departmentId: selectedDepartmentId,
        search: searchQuery,
        date: todayDateStr
      });
      setData(res);
    } catch (err) {
      console.warn('Failed to load doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeHospitalId, activeTab, selectedDoctorId, selectedDepartmentId]);

  // Realtime Supabase CDC on doctor_appointments
  useEffect(() => {
    if (!activeHospitalId) return;

    const channel = supabase
      .channel(`doctor-appointments-live-${activeHospitalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctor_appointments', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId, activeTab, selectedDoctorId, selectedDepartmentId]);

  // Handle Manual Mark Completed
  const handleMarkCompleted = async (appointmentId) => {
    try {
      setActionLoading(true);
      await hospitalPortalService.updateAppointmentStatus(appointmentId, 'completed', 'Consultation finished by physician');
      showToast('Encounter marked as Completed.');
      loadData();
    } catch (err) {
      console.warn('Error marking completed:', err);
      showToast('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation appointment?')) return;
    try {
      setActionLoading(true);
      await hospitalPortalService.updateAppointmentStatus(appointmentId, 'cancelled', 'Cancelled by hospital desk');
      showToast('Appointment cancelled.');
      loadData();
    } catch (err) {
      console.warn('Error cancelling appointment:', err);
      showToast('Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const counts = data?.counts || { all: 0, today: 0, scheduled: 0, upcoming: 0, confirmed: 0, completed: 0, cancelled: 0 };
  const appointments = data?.appointments || [];
  const doctorsList = data?.doctors || [];
  const departmentsList = data?.departments || [];

  // Client-side search filtering
  const filteredAppointments = appointments.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.patientName.toLowerCase().includes(q) ||
      a.doctorName.toLowerCase().includes(q) ||
      a.departmentName.toLowerCase().includes(q) ||
      a.abhaId.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q)
    );
  });

  return (
    <HospitalLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live OPD Desk • Today ({new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })})
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">{activeHospital?.name || 'Hospital Facility'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Doctor OPD Appointments & Encounters</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise scheduled consultations, verify patient ABHA QR codes, and automatically complete clinical encounters via QR scan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary QR Action: Scan QR to Complete Encounter */}
            <button
              onClick={() => {
                setSelectedAppointment(null);
                setQrModalMode('complete');
                setQrModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
              title="Scan any patient QR code to automatically find and complete today's encounter"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR & Complete Encounter</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('Scheduled')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'Scheduled' 
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-sm' 
                : 'bg-white border-slate-200/80 shadow-sm hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Scheduled Today</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700">{counts.scheduled}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Today's scheduled patients</div>
          </div>

          <div 
            onClick={() => setActiveTab('Confirmed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'Confirmed' 
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' 
                : 'bg-white border-slate-200/80 shadow-sm hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Checked In</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-700">{counts.confirmed}</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Checked in at reception</div>
          </div>

          <div 
            onClick={() => setActiveTab('Completed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'Completed' 
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm' 
                : 'bg-white border-slate-200/80 shadow-sm hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                <Check className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700">{counts.completed}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Encounters closed</div>
          </div>

          <div 
            onClick={() => setActiveTab('Upcoming')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeTab === 'Upcoming' 
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-sm' 
                : 'bg-white border-slate-200/80 shadow-sm hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Upcoming Scheduled</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-blue-700">{counts.upcoming}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Future scheduled consultations</div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
            {[
              { id: 'Scheduled', label: "Today's Scheduled", count: counts.scheduled, badgeBg: 'bg-amber-100 text-amber-800' },
              { id: 'Confirmed', label: 'Checked In', count: counts.confirmed, badgeBg: 'bg-indigo-100 text-indigo-800' },
              { id: 'Completed', label: 'Completed', count: counts.completed, badgeBg: 'bg-emerald-100 text-emerald-800' },
              { id: 'Upcoming', label: 'Upcoming Scheduled', count: counts.upcoming, badgeBg: 'bg-blue-100 text-blue-800' },
              { id: 'All', label: 'All Consultations', count: counts.all, badgeBg: 'bg-slate-200 text-slate-700' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : tab.badgeBg
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Secondary Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, doctor, or code..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Doctor Filter */}
            <div className="relative">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 bg-white"
              >
                <option value="all">All Doctors ({doctorsList.length})</option>
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} • {doc.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 bg-white"
              >
                <option value="all">All Departments ({departmentsList.length})</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading Doctor OPD Appointments...</p>
            <p className="text-xs text-slate-400 mt-1">Synchronizing live records from database</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {activeTab === 'Scheduled' ? 'No patients scheduled for today' : `No ${activeTab.toLowerCase()} appointments found`}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'Scheduled' 
                ? 'There are no pending doctor consultations scheduled for today. You can check the "Upcoming Scheduled" tab for future bookings or use "Scan QR & Complete Encounter" at the top.'
                : 'There are currently no doctor consultations recorded under this filter.'}
            </p>
            {activeTab === 'Scheduled' && counts.upcoming > 0 && (
              <button
                onClick={() => setActiveTab('Upcoming')}
                className="mt-3 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                View Upcoming Scheduled ({counts.upcoming}) →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAppointments.map((appt) => {
              const isScheduled = appt.rawStatus === 'scheduled' || appt.rawStatus === 'pending';
              const isConfirmed = appt.rawStatus === 'confirmed' || appt.rawStatus === 'checked_in';
              const isCompleted = appt.rawStatus === 'completed';
              const isCancelled = appt.rawStatus === 'cancelled';

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-sm p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Code, Doctor & Department */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                      {appt.doctorImage ? (
                        <img 
                          src={appt.doctorImage} 
                          alt={appt.doctorName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Stethoscope className="w-7 h-7 text-emerald-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {appt.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {appt.departmentName}
                        </span>
                        {appt.consultationType === 'video' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 flex items-center gap-1 border border-purple-200">
                            <Video className="w-3 h-3" /> Teleconsult
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200">
                            <Building2 className="w-3 h-3" /> In-Clinic OPD
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 text-base">{appt.doctorName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{appt.doctorSpecialization}</p>

                      <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                          {appt.appointmentDate} • {appt.appointmentTime}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-emerald-700">
                          Fee: ₹{appt.consultationFee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Patient Profile Details */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 min-w-[260px] space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Patient Details</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{appt.patientName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        {appt.bloodGroup}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>{appt.ageGender}</span>
                      <span className="font-mono text-slate-600">{appt.patientPhone}</span>
                    </div>
                    {isCompleted ? (
                      <div className="text-[11px] font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-400 font-sans">ABHA ID:</span>
                        <span className="font-bold text-slate-800">{appt.abhaId}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] bg-slate-100/90 text-slate-500 px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1 text-slate-500">
                          <QrCode className="w-3 h-3 text-blue-600" />
                          <span>ABHA Protected</span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-600">Scan QR to Reveal</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-col sm:items-end justify-between gap-3 min-w-[220px]">
                    <div>
                      {isScheduled && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Scheduled (Today)
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          Checked-In (Ready for Doctor)
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          Encounter Completed
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isScheduled && (
                        <>
                          {/* Complete Encounter via QR Scan directly */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setQrModalMode('complete');
                              setQrModalOpen(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                            title="Scan Patient QR Code to Automatically Complete Clinical Encounter"
                          >
                            <QrCode className="w-4 h-4" />
                            Scan QR & Complete
                          </button>

                          {/* Check-In Option */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setQrModalMode('check_in');
                              setQrModalOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition-all"
                            title="Scan Patient QR Code to Check In"
                          >
                            Check In
                          </button>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          {/* Scan QR & Complete Encounter */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setQrModalMode('complete');
                              setQrModalOpen(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                            title="Scan Patient QR Code to Automatically Complete Encounter"
                          >
                            <QrCode className="w-4 h-4" />
                            Scan QR & Complete
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleMarkCompleted(appt.id)}
                            className="px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition-colors"
                          >
                            Manual
                          </button>
                        </>
                      )}

                      {!isCancelled && !isCompleted && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QR Scanner & Encounter Completion Modal */}
        {qrModalOpen && (
          <DoctorAppointmentQrModal
            isOpen={qrModalOpen}
            onClose={() => {
              setQrModalOpen(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            hospitalId={activeHospitalId}
            mode={qrModalMode}
            onSuccess={() => {
              showToast(qrModalMode === 'complete' ? 'Encounter completed automatically via QR scan!' : 'Patient check-in confirmed via QR scan!');
              loadData();
            }}
          />
        )}
      </div>
    </HospitalLayout>
  );
}
