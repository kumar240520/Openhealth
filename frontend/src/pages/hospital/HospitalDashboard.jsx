import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BedDouble, 
  HeartPulse, 
  Calendar, 
  Stethoscope, 
  ShieldCheck, 
  ArrowUpRight, 
  RotateCw, 
  Eye, 
  Plus, 
  TrendingUp, 
  Package, 
  FileSpreadsheet, 
  ArrowRight,
  Sparkles,
  Siren,
  Building2,
  X,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import HospitalKycBanner from '../../components/hospital/HospitalKycBanner';
import HospitalOnboardingModal from '../../components/hospital/HospitalOnboardingModal';

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { activeHospital, activeHospitalId, refreshHospital } = useHospital();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('10:30 AM');
  const [selectedBookingModal, setSelectedBookingModal] = useState(null);

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isKycOnlyModal, setIsKycOnlyModal] = useState(false);

  useEffect(() => {
    // If onboarding is incomplete, navigate directly to full-page onboarding wizard
    if (activeHospital && activeHospital.onboarding_completed === false) {
      navigate('/hospital/onboarding', { replace: true });
    }
  }, [activeHospital, navigate]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getDashboardMetrics(activeHospitalId);
      setData(res);
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.warn('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [activeHospitalId]);

  return (
    <HospitalLayout>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* =================================================================== */}
        {/* 1. TOP GREETING HEADER */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Good morning, {data?.hospitalName || activeHospital?.name || 'Hospital Admin'}</span>
              <span>👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Here's your hospital's operational overview for today.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-semibold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
        </div>

        {/* KYC Compliance & Verification Banner (Vanishes when verified) */}
        <HospitalKycBanner onOpenKyc={() => { setIsKycOnlyModal(true); setOnboardingOpen(true); }} />

        {/* =================================================================== */}
        {/* 2. TOP 5 KPI SUMMARY CARDS (Page 1 in PDF) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          
          {/* Card 1: Available Beds */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Available Beds</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{data?.kpis?.availableBeds?.count ?? 0}</span>
                  <span className="text-xs font-semibold text-slate-400">of {data?.kpis?.availableBeds?.total ?? 0} Beds</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BedDouble className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>▲ Live from Ward Roster</span>
            </div>
          </div>

          {/* Card 2: ICU Available */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">ICU Available</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{data?.kpis?.icuAvailable?.count ?? 0}</span>
                  <span className="text-xs font-semibold text-slate-400">of {data?.kpis?.icuAvailable?.total ?? 0} Beds</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>▲ Critical Care Unit</span>
            </div>
          </div>

          {/* Card 3: Active Bookings */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Active Bookings</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{data?.kpis?.activeBookings?.count ?? 0}</span>
                  <span className="text-xs font-semibold text-slate-400">Today</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>▲ Synced with Patient Portal</span>
            </div>
          </div>

          {/* Card 4: Doctors Available */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Doctors Available</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">{data?.kpis?.doctorsAvailable?.count ?? 0}</span>
                  <span className="text-xs font-semibold text-slate-400">of {data?.kpis?.doctorsAvailable?.total ?? 0} Doctors</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>▲ On Duty Specialist Roster</span>
            </div>
          </div>

          {/* Card 5: Transparency Score */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3 col-span-2 md:col-span-1 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Transparency Score</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-emerald-600">
                    {data?.kpis?.transparencyScore?.score ?? (activeHospital?.transparency_score ?? 75)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ 100</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">
                    {(data?.kpis?.transparencyScore?.score ?? (activeHospital?.transparency_score ?? 75)) >= 85 ? 'Excellent' : ((data?.kpis?.transparencyScore?.score ?? (activeHospital?.transparency_score ?? 75)) >= 65 ? 'Good' : 'Building')}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>▲ OpenHealth Audited</span>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 3. MIDDLE SECTION: BED OVERVIEW (50%) & TODAY'S BOOKINGS (50%)      */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Box 1: Bed Availability Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">Bed Availability Overview</h3>
                </div>
                <button
                  type="button"
                  onClick={loadMetrics}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>Last updated: {lastUpdatedTime}</span>
                  <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto touch-scroll-x mt-3">
                <table className="w-full min-w-[420px] text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Bed Type</th>
                      <th className="py-2.5 px-2 text-center">Total Beds</th>
                      <th className="py-2.5 px-2 text-center">Occupied</th>
                      <th className="py-2.5 px-2 text-center">Reserved</th>
                      <th className="py-2.5 px-2 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {data?.bedOverview?.map((row, idx) => (
                      <tr key={idx} className={row.isTotal ? 'font-black text-slate-900 bg-slate-50/50' : 'hover:bg-slate-50/70'}>
                        <td className="py-2.5 px-2 flex items-center gap-2">
                          {!row.isTotal && (
                            <span className={`w-2 h-2 rounded-full ${
                              row.badge === 'rose' ? 'bg-rose-500' : row.badge === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
                            }`} />
                          )}
                          <span>{row.type}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">{row.total}</td>
                        <td className="py-2.5 px-2 text-center">{row.occupied}</td>
                        <td className="py-2.5 px-2 text-center">{row.reserved}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded font-black ${
                            row.isTotal ? 'text-blue-700 bg-blue-50' : 'text-emerald-700 bg-emerald-50'
                          }`}>
                            {row.available}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/hospital/beds')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Bed Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Box 2: Today's Bookings */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900">Today's Bookings</h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/hospital/bookings')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All Bookings
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto touch-scroll-x mt-3">
                <table className="w-full min-w-[580px] text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Booking ID</th>
                      <th className="py-2.5 px-2">Patient / Guest</th>
                      <th className="py-2.5 px-2">Department</th>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2">Time Slot</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {data?.recentBookings && data.recentBookings.length > 0 ? (
                      data.recentBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-2 font-mono text-[11px] font-bold text-slate-800">{b.bookingCode}</td>
                          <td className="py-2.5 px-2 font-bold text-slate-900">{b.patientName}</td>
                          <td className="py-2.5 px-2 text-slate-500">{b.department}</td>
                          <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{b.date}</td>
                          <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{b.timeSlot}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Confirmed' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : b.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedBookingModal(b)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View Booking Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-xs text-slate-400 font-medium">
                          No recent patient appointments or reservations recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/hospital/bookings')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Admissions Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 4. BOTTOM ROW: QUICK ACTIONS, PERFORMANCE, TRANSPARENCY (Page 1)    */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Quick Actions</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/hospital/beds')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/30 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Add / Update Beds</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/hospital/doctors')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/30 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Add Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/hospital/treatments')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-purple-500 hover:bg-purple-50/30 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Add Treatment</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/hospital/packages')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/30 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Create Package</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/hospital/bookings')}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>View All Bookings</span>
            </button>
          </div>

          {/* Card 2: Hospital Performance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">Hospital Performance</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">This Week</span>
              </div>

              {/* Sparklines summary */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Trends</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-black text-slate-900">▲ 15%</span>
                    <span className="text-[10px] text-emerald-600 font-bold">vs last wk</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bed Utilization</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-black text-slate-900">▲ 9%</span>
                    <span className="text-[10px] text-emerald-600 font-bold">optimal</span>
                  </div>
                </div>
              </div>

              {/* Mini visual bars */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Popular Treatments</span>
                  <button type="button" onClick={() => navigate('/hospital/treatments')} className="text-[11px] font-bold text-blue-600 cursor-pointer">View All</button>
                </div>
                <div className="flex items-end gap-2 h-12 pt-2">
                  {data?.performance?.popularTreatments?.map((t, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(t.value / 45) * 100}%` }}
                        title={`${t.name}: ${t.value}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/hospital/analytics')}
              className="mt-3 w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 border-t border-slate-100 cursor-pointer"
            >
              <span>Explore Analytics Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Transparency Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">Transparency Snapshot</h3>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {data?.transparencySnapshot?.overallScore ?? 88} / 100
                </span>
              </div>

              {/* 5 Factor Progress Bars */}
              <div className="flex flex-col gap-2.5 mt-4">
                {data?.transparencySnapshot?.factors?.map((f, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>{f.label}</span>
                      <span className="text-slate-900">{f.score} / 100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${f.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/hospital/transparency')}
              className="mt-4 w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 border-t border-slate-100 cursor-pointer"
            >
              <span>View Transparency Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Booking Quick View Modal */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-slate-900">Booking Details</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedBookingModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase">Booking ID</span>
                <span className="font-mono font-black text-slate-900">{selectedBookingModal.bookingCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase">Patient Name</span>
                <span className="font-extrabold text-slate-900">{selectedBookingModal.patientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase">Department</span>
                <span className="font-bold text-blue-600">{selectedBookingModal.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase">Scheduled Time</span>
                <span className="font-bold text-slate-800">{selectedBookingModal.date} • {selectedBookingModal.timeSlot}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold uppercase">Status</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700">
                  {selectedBookingModal.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBookingModal(null);
                  navigate('/hospital/bookings');
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Open in Admissions Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding & KYC Modal */}
      <HospitalOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => {
          setOnboardingOpen(false);
          sessionStorage.setItem('hospital_onboarding_dismissed', 'true');
        }}
        isKycOnly={isKycOnlyModal}
        onCompleted={() => {
          loadMetrics();
          refreshHospital();
        }}
      />
    </HospitalLayout>
  );
}
