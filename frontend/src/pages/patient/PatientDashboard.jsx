import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  Building2,
  Stethoscope,
  Bell,
  FileText,
  ShieldCheck,
  Receipt,
  Calendar,
  Bookmark,
  Settings,
  User,
  LogOut,
  Search,
  Plus,
  MapPin,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Menu,
  X,
  Shield,
  Activity,
  Heart,
  Loader2,
  Inbox,
  Clock,
  Video,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import AppLayout from '../../components/layout/AppLayout';
import { getDistanceToHospital } from '../../services/geolocationService';
import { bookingService } from '../../services/bookingService';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, profile, userLocation } = useAuth();

  // Navigation and filter states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selectedCity, setSelectedCity] = useState('Indore, MP');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Database Pipelined State (Zero Mock Data Rule)
  const [loading, setLoading] = useState(true);
  const [isKycVerified, setIsKycVerified] = useState(true);
  const [metrics, setMetrics] = useState({
    saved_hospitals: 0,
    upcoming_bookings: 0,
    reports_analyzed: 0,
    bills_analyzed: 0,
    unread_notifications: 0,
    kpi: {
      searches: { count: 0, trend: 0 },
      comparisons: { count: 0, trend: 0 },
      reservations: { count: 0, trend: 0 },
      bill_savings: { amount: 0, trend: 0 }
    },
    chart_data: [],
    recent_searches: [],
    recent_bookings: []
  });

  // Dynamic user name
  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Patient';

  // Fetch real data from PostgreSQL pipeline
  const fetchDashboardMetrics = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const periodParam = timeFilter === 'This Month' 
        ? 'this_month' 
        : timeFilter === 'Past 3 Months' 
        ? 'past_3_months' 
        : 'this_week';

      // 1. Check KYC verification state
      const { data: kycCheck } = await supabase
        .from('patient_profiles')
        .select('kyc_status, aadhaar_number, govt_id_number')
        .eq('user_id', user.id)
        .maybeSingle();
      const verified = kycCheck?.kyc_status === 'verified' && Boolean(kycCheck?.aadhaar_number || kycCheck?.govt_id_number);
      setIsKycVerified(Boolean(verified));

      // 2. Call Secure Supabase Database RPC
      const { data, error } = await supabase.rpc('get_patient_dashboard_data', {
        p_period: periodParam
      });

      if (error) {
        console.warn('RPC fetch failed, falling back to direct table queries:', error);
        await fetchFallbackData();
      } else if (data && !data.error) {
        setMetrics({
          saved_hospitals: Number(data.saved_hospitals) || 0,
          upcoming_bookings: Number(data.upcoming_bookings) || 0,
          reports_analyzed: Number(data.reports_analyzed) || 0,
          bills_analyzed: Number(data.bills_analyzed) || 0,
          unread_notifications: Number(data.unread_notifications) || 0,
          kpi: {
            searches: { 
              count: Number(data.kpi?.searches?.count) || 0, 
              trend: Number(data.kpi?.searches?.trend) || 0 
            },
            comparisons: { 
              count: Number(data.kpi?.comparisons?.count) || 0, 
              trend: Number(data.kpi?.comparisons?.trend) || 0 
            },
            reservations: { 
              count: Number(data.kpi?.reservations?.count) || 0, 
              trend: Number(data.kpi?.reservations?.trend) || 0 
            },
            bill_savings: { 
              amount: Number(data.kpi?.bill_savings?.amount) || 0, 
              trend: Number(data.kpi?.bill_savings?.trend) || 0 
            }
          },
          chart_data: Array.isArray(data.chart_data) ? data.chart_data : [],
          recent_searches: Array.isArray(data.recent_searches) ? data.recent_searches : [],
          recent_bookings: Array.isArray(data.recent_bookings) ? data.recent_bookings : []
        });

        // Ensure real bookings are always populated from bookingService
        try {
          const bData = await bookingService.getPatientBookings();
          if (bData?.all && bData.all.length > 0) {
            const activeBookings = bData.all.filter(b => ['confirmed', 'held', 'pending'].includes(b.status));
            setMetrics(prev => ({
              ...prev,
              upcoming_bookings: activeBookings.length || bData.all.length,
              recent_bookings: (activeBookings.length > 0 ? activeBookings : bData.all).slice(0, 4)
            }));
          }
        } catch (bErr) {
          console.warn('Dashboard booking fetch notice:', bErr);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard pipeline data:', err);
      await fetchFallbackData();
    } finally {
      setLoading(false);
    }
  }, [user, timeFilter]);

  // Direct Table Queries Fallback (Zero Mock Data)
  const fetchFallbackData = async () => {
    try {
      // Resolve patient profile & KYC status
      let { data: pProf } = await supabase
        .from('patient_profiles')
        .select('id, kyc_status, aadhaar_number, govt_id_number')
        .eq('user_id', user.id)
        .maybeSingle();

      const pId = pProf?.id || user.id;
      const verified = pProf?.kyc_status === 'verified' && Boolean(pProf?.aadhaar_number || pProf?.govt_id_number);
      setIsKycVerified(Boolean(verified));

      const [
        savedRes,
        bookingsRes,
        apptsRes,
        bedsRes,
        docsRes,
        billsRes,
        searchesRes,
        recentSearchesRes,
        notifsRes,
        recentApptsRes
      ] = await Promise.all([
        supabase.from('saved_hospitals').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`).in('status', ['pending', 'confirmed']),
        supabase.from('doctor_appointments').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`).in('status', ['pending', 'confirmed']),
        supabase.from('bed_reservations').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`).in('status', ['pending', 'confirmed', 'held']),
        supabase.from('medical_documents').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`),
        supabase.from('bills').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`),
        supabase.from('search_history').select('*', { count: 'exact', head: true }).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`),
        supabase.from('search_history').select('id, query, filters, created_at').or(`patient_id.eq.${pId},patient_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(3),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
        supabase.from('doctor_appointments').select(`
          id,
          appointment_date,
          appointment_time,
          consultation_type,
          status,
          consultation_fee,
          doctors (name, specialization, image_url),
          hospitals (name, city, latitude, longitude)
        `).or(`patient_id.eq.${pId},patient_id.eq.${user.id}`).order('appointment_date', { ascending: false }).limit(4)
      ]);

      const totalBookings = (bookingsRes.count || 0) + (apptsRes.count || 0) + (bedsRes.count || 0);

      setMetrics(prev => ({
        ...prev,
        saved_hospitals: savedRes.count || 0,
        upcoming_bookings: totalBookings,
        reports_analyzed: docsRes.count || 0,
        bills_analyzed: billsRes.count || 0,
        unread_notifications: notifsRes.count || 0,
        kpi: {
          searches: { count: searchesRes.count || 0, trend: 0 },
          comparisons: { count: 0, trend: 0 },
          reservations: { count: totalBookings, trend: 0 },
          bill_savings: { amount: 0, trend: 0 }
        },
        chart_data: [
          { day: 'Mon', value: 0 },
          { day: 'Tue', value: 0 },
          { day: 'Wed', value: 0 },
          { day: 'Thu', value: 0 },
          { day: 'Fri', value: 0 },
          { day: 'Sat', value: 0 },
          { day: 'Sun', value: 0 },
        ],
        recent_searches: recentSearchesRes.data || []
      }));

      // Populate bookings from unified bookingService
      try {
        const bData = await bookingService.getPatientBookings();
        if (bData?.all && bData.all.length > 0) {
          const activeBookings = bData.all.filter(b => ['confirmed', 'held', 'pending'].includes(b.status));
          setMetrics(prev => ({
            ...prev,
            upcoming_bookings: activeBookings.length || bData.all.length,
            recent_bookings: (activeBookings.length > 0 ? activeBookings : bData.all).slice(0, 4)
          }));
        }
      } catch (bErr) {
        console.warn('Fallback booking service notice:', bErr);
      }
    } catch (err) {
      console.error('Fallback query error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // Handle Search Submission and live DB logging
  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        await supabase.rpc('log_patient_search', {
          p_query: searchQuery.trim(),
          p_location: selectedCity
        });
      } catch (err) {
        console.error('Failed to log search:', err);
      }
      navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  };

  // Sidebar navigation configuration (Beds & Find Care removed per instruction)
  const primaryNavItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/patient' },
    { id: 'Hospitals', label: 'Hospitals', icon: Building2, path: '/app/hospitals' },
    { id: 'Doctors', label: 'Doctors', icon: Stethoscope, path: '/app/doctors' },
    { id: 'Emergency', label: 'Emergency', icon: Bell, path: '/app/emergency', isEmergency: true },
    { id: 'Bookings', label: 'Bookings', icon: Calendar, path: '/app/bookings' },
    { id: 'Bills', label: 'My Bills', icon: Receipt, path: '/app/bills' },
    { id: 'Reports', label: 'Reports', icon: FileText, path: '/app/reports' },
    { id: 'Saved', label: 'Saved', icon: Bookmark, path: '/app/saved' },
  ];

  const bottomNavItems = [
    { id: 'Settings', label: 'Settings', icon: Settings, path: '/app/settings' },
    { id: 'Profile', label: 'Profile', icon: User, path: '/app/profile' },
  ];

  const handleNavClick = (item) => {
    setActiveNav(item.id);
    if (item.id === 'Emergency') {
      navigate('/app/emergency');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <AppLayout>
      {/* DASHBOARD BODY CONTENT */}
      <main className="p-4 sm:p-6 lg:p-8 xl:px-10 2xl:px-12 flex flex-col gap-6 max-w-[1720px] mx-auto w-full min-w-0">
          
          {/* Greeting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Dashboard
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                <span>Home</span>
                <span>›</span>
                <span className="text-slate-600 font-semibold">Dashboard</span>
              </div>
            </div>

            <div className="sm:text-right">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center sm:justify-end gap-2">
                <span>Welcome back, {displayName}</span>
                <span className="inline-block animate-wave">👋</span>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </h2>
              <p className="text-xs text-slate-500">
                Here's what's happening with your healthcare journey today.
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SMALL BOX: COMPLETE THE KYC DOCUMENTS (Shown if incomplete)          */}
          {/* ===================================================================== */}
          {!isKycVerified && (
            <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Complete the KYC Documents
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Link your Government Aadhaar or Medical ID to activate your official Digital Health Pass and speed up hospital admissions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/app/profile')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Complete KYC</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 1. TOP 4 SUMMARY METRIC CARDS (100% Real Database Pipelined) */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Saved Hospitals */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-200/50 flex items-center justify-center text-blue-600 shadow-inner p-2.5">
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Saved Hospitals</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">{metrics.saved_hospitals}</span>
                    <span className="text-xs text-slate-400 font-medium">Hospitals</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => navigate('/app/saved')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5 transition-colors cursor-pointer group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* 2. Upcoming Bookings */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 shadow-inner p-2.5">
                  <Calendar className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Upcoming Bookings</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">{metrics.upcoming_bookings}</span>
                    <span className="text-xs text-slate-400 font-medium">Bookings</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => navigate('/app/bookings')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5 transition-colors cursor-pointer group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* 3. Reports Analyzed */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-200/50 flex items-center justify-center text-purple-600 shadow-inner p-2.5">
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Reports Analyzed</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">{metrics.reports_analyzed}</span>
                    <span className="text-xs text-slate-400 font-medium">Reports</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => navigate('/app/documents')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5 transition-colors cursor-pointer group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* 4. Bills Analyzed */}
            <div className="p-5 rounded-2xl bg-white border border-slate-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-200/50 flex items-center justify-center text-amber-600 shadow-inner p-2.5">
                  <Receipt className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Bills Analyzed</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">{metrics.bills_analyzed}</span>
                    <span className="text-xs text-slate-400 font-medium">Bills</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => navigate('/app/bills')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5 transition-colors cursor-pointer group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* 2. MIDDLE ROW: REAL ACTIVITY GRAPH + EMERGENCY & HEALTH TIP */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Left 8 Cols: Real Smart Care Activity Chart Card */}
            <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-4">
              
              {/* Header with Time Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Smart Care Overview
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Live patient activity pipeline across searches, bookings, and records
                  </p>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>{timeFilter}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {timeDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 text-xs text-slate-700">
                      {['This Week', 'This Month', 'Past 3 Months'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setTimeFilter(tf);
                            setTimeDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-100"
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Responsive Area Line Chart with Live Telemetry */}
              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={metrics.chart_data.length > 0 ? metrics.chart_data : [
                      { day: 'Day 1', value: 0 },
                      { day: 'Day 2', value: 0 },
                      { day: 'Day 3', value: 0 },
                      { day: 'Day 4', value: 0 },
                      { day: 'Day 5', value: 0 },
                      { day: 'Day 6', value: 0 },
                      { day: 'Day 7', value: 0 },
                    ]} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="careOverviewGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                      dy={5}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '12px', 
                        border: 'none', 
                        color: '#fff', 
                        fontSize: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)' 
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#careOverviewGradient)" 
                      dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2.5 }}
                      activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Right 4 Cols: Emergency Access Card & Health Tip Card */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-5">
              
              {/* Emergency Access Card */}
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-white to-red-50/50 border border-red-100 shadow-[0_4px_25px_rgba(239,68,68,0.06)] flex flex-col justify-between flex-1 min-h-[160px]">
                
                <div className="relative z-10 max-w-[65%] flex flex-col gap-1.5">
                  <h4 className="text-sm sm:text-base font-extrabold text-red-600 tracking-tight">
                    Emergency Access
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Quickly find ICU beds and hospitals near you.
                  </p>
                  
                  <button
                    onClick={() => navigate('/app/emergency')}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-md shadow-red-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer w-fit"
                  >
                    <span>Go to Emergency</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 3D Ambulance Vector Illustration Graphic */}
                <div className="absolute right-2 bottom-3 w-32 h-28 pointer-events-none select-none flex items-center justify-center">
                  <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="100" cy="130" rx="75" ry="12" fill="#e2e8f0" />
                    <rect x="35" y="45" width="115" height="65" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3"/>
                    <path d="M150 65 L175 80 L175 110 L150 110 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3"/>
                    <path d="M152 68 L170 80 L152 80 Z" fill="#38bdf8" />
                    <rect x="35" y="75" width="135" height="12" fill="#ef4444" />
                    <rect x="80" y="52" width="20" height="6" rx="2" fill="#ef4444" />
                    <rect x="87" y="45" width="6" height="20" rx="2" fill="#ef4444" />
                    <rect x="85" y="38" width="12" height="7" rx="3" fill="#3b82f6" />
                    <circle cx="65" cy="115" r="15" fill="#1e293b" stroke="#94a3b8" strokeWidth="4"/>
                    <circle cx="145" cy="115" r="15" fill="#1e293b" stroke="#94a3b8" strokeWidth="4"/>
                  </svg>
                </div>
              </div>

              {/* Health Tip Card */}
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/50 border border-blue-100 shadow-[0_4px_25px_rgba(59,130,246,0.06)] flex flex-col justify-between flex-1 min-h-[150px]">
                
                <div className="relative z-10 max-w-[65%] flex flex-col gap-1.5">
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Health Tip
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Early diagnosis and timely treatment can lead to better health outcomes.
                  </p>
                </div>

                {/* 3D Glowing Blue Medical Shield Vector Illustration */}
                <div className="absolute right-3 bottom-2 w-28 h-28 pointer-events-none select-none flex items-center justify-center">
                  <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="80" cy="80" r="50" fill="#60a5fa" fillOpacity="0.16" />
                    <path d="M80 25 C115 25 125 45 125 80 C125 115 80 135 80 135 C80 135 35 115 35 80 C35 45 45 25 80 25 Z" fill="url(#shieldGrad)" stroke="#38bdf8" strokeWidth="3"/>
                    <rect x="68" y="74" width="24" height="8" rx="2" fill="#ffffff" />
                    <rect x="76" y="66" width="8" height="24" rx="2" fill="#ffffff" />
                    <defs>
                      <linearGradient id="shieldGrad" x1="35" y1="25" x2="125" y2="135" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38bdf8" />
                        <stop offset="1" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

              </div>

            </div>

          </div>

          {/* ===================================================================== */}
          {/* 3. DEDICATED FULL-WIDTH HORIZONTAL ROW: 4 SEPARATE KPI CARDS */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Searches Card */}
            <div className="p-4 sm:p-5 sm:px-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-200/40 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-slate-500 font-semibold block">Searches</span>
                <span className="text-xl font-black text-slate-900 leading-tight my-0.5">{metrics.kpi.searches.count}</span>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${metrics.kpi.searches.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.kpi.searches.trend >= 0 ? <TrendingUp className="w-3 h-3 stroke-[2.5]" /> : <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                  <span>{Math.abs(metrics.kpi.searches.trend)}% <span className="text-slate-400 font-normal">vs last period</span></span>
                </div>
              </div>
            </div>

            {/* 2. Comparisons Card */}
            <div className="p-4 sm:p-5 sm:px-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-200/40 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Calendar className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-slate-500 font-semibold block">Comparisons</span>
                <span className="text-xl font-black text-slate-900 leading-tight my-0.5">{metrics.kpi.comparisons.count}</span>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${metrics.kpi.comparisons.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.kpi.comparisons.trend >= 0 ? <TrendingUp className="w-3 h-3 stroke-[2.5]" /> : <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                  <span>{Math.abs(metrics.kpi.comparisons.trend)}% <span className="text-slate-400 font-normal">vs last period</span></span>
                </div>
              </div>
            </div>

            {/* 3. Reservations Card */}
            <div className="p-4 sm:p-5 sm:px-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-200/40 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <FileText className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-slate-500 font-semibold block">Reservations</span>
                <span className="text-xl font-black text-slate-900 leading-tight my-0.5">{metrics.kpi.reservations.count}</span>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${metrics.kpi.reservations.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.kpi.reservations.trend >= 0 ? <TrendingUp className="w-3 h-3 stroke-[2.5]" /> : <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                  <span>{Math.abs(metrics.kpi.reservations.trend)}% <span className="text-slate-400 font-normal">vs last period</span></span>
                </div>
              </div>
            </div>

            {/* 4. Bill Savings Est Card */}
            <div className="p-4 sm:p-5 sm:px-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-200/40 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Receipt className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-slate-500 font-semibold block">Bill Savings Est.</span>
                <span className="text-xl font-black text-slate-900 leading-tight my-0.5">₹{metrics.kpi.bill_savings.amount.toLocaleString('en-IN')}</span>
                <div className={`flex items-center gap-1 text-[11px] font-bold ${metrics.kpi.bill_savings.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {metrics.kpi.bill_savings.trend >= 0 ? <TrendingUp className="w-3 h-3 stroke-[2.5]" /> : <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                  <span>{Math.abs(metrics.kpi.bill_savings.trend)}% <span className="text-slate-400 font-normal">vs last period</span></span>
                </div>
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* 4. UPCOMING APPOINTMENTS & ACTIVE BOOKINGS (100% Real Live Database)   */}
          {/* ===================================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Upcoming Consultations & Bookings
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Live verified doctor appointments and hospital admissions linked to your patient profile
                </p>
              </div>

              <button
                onClick={() => navigate('/app/bookings')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer group"
              >
                <span>View all ({metrics.upcoming_bookings})</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {metrics.recent_bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {metrics.recent_bookings.map((booking, idx) => {
                  const title = booking.title || booking.doctor_name || booking.doctorName || 'Doctor Appointment';
                  const subtitle = booking.specialization || booking.bedTypeName || 'Clinical Consultation';
                  const hospName = booking.hospital_name || booking.hospitalName || 'Hospital';
                  const hospCity = booking.hospital_city || booking.hospitalCity || '';
                  const hospLat = booking.hospital_latitude || booking.hospitalLatitude;
                  const hospLng = booking.hospital_longitude || booking.hospitalLongitude;
                  const date = booking.date || booking.appointment_date || 'Scheduled';
                  const time = booking.time || booking.appointment_time || '10:00 AM';
                  const fee = booking.payableAmount || (booking.consultation_fee ? `₹${booking.consultation_fee}` : 'Payable at Hospital');
                  const img = booking.doctor_image || booking.doctorImage || booking.hospital_image || booking.hospitalImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                  const isBed = booking.bookingType === 'bed_reservation';

                  return (
                    <div
                      key={booking.id || idx}
                      onClick={() => navigate('/app/bookings')}
                      className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col justify-between gap-3 shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={img}
                            alt={title}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                            }}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {title}
                            </h4>
                            <span className="text-xs text-blue-600 font-semibold block truncate">
                              {subtitle}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                              {hospName}{hospCity ? `, ${hospCity}` : ''}
                              {(() => {
                                const dist = booking.distanceKm ?? getDistanceToHospital({
                                  name: hospName,
                                  city: hospCity,
                                  latitude: hospLat,
                                  longitude: hospLng
                                }, userLocation);
                                return dist !== null && dist !== undefined ? ` • ${dist} km away` : '';
                              })()}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : booking.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-slate-600 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">
                            {isBed ? 'Bed Hold' : booking.consultation_type === 'video' ? 'Video' : 'In-Clinic'}
                          </span>
                          <span className="font-black text-slate-900">
                            {fee}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    No upcoming appointments or bed reservations scheduled
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                    Browse top verified specialists across empanelled hospitals and book instant in-clinic or video teleconsultations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/app/doctors')}
                  className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
                >
                  Find & Book a Doctor
                </button>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* 5. BOTTOM ROW: RECENT SEARCHES (100% Real History) */}
          {/* ===================================================================== */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Recent Searches
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Your live search history and viewed treatments
                </p>
              </div>
              <button 
                onClick={() => navigate('/app/search')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer group"
              >
                <span>View all searches</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Horizontal Search Cards or Empty State */}
            {metrics.recent_searches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {metrics.recent_searches.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    onClick={() => navigate(`/app/search?q=${encodeURIComponent(item.query)}`)}
                    className="p-4 rounded-2xl bg-slate-50/90 hover:bg-slate-100 border border-slate-100 transition-all cursor-pointer flex items-center justify-between group shadow-sm hover:shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Activity className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {item.query}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {item.location || selectedCity}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap pl-2 flex-shrink-0">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 block">
                    No recent searches yet
                  </span>
                  <span className="text-xs text-slate-400">
                    Search for hospitals, doctors, or medical tests in the search bar above to build your discovery history.
                  </span>
                </div>
                <button
                  onClick={() => navigate('/app/search')}
                  className="mt-1 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Discover Care Now
                </button>
              </div>
            )}

          </div>

        </main>
    </AppLayout>
  );
}
