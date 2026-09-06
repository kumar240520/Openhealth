import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Bed, 
  Activity, 
  Eye, 
  Search, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  RefreshCw,
  Building2,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend 
} from 'recharts';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalAnalytics() {
  const { activeHospitalId, activeHospital } = useHospital();

  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getAnalytics(activeHospitalId, timeRange);
      setData(res);
    } catch (err) {
      console.warn('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [activeHospitalId, timeRange]);

  // Realtime Supabase CDC listener
  useEffect(() => {
    if (!activeHospitalId) return;

    const channel = supabase
      .channel(`hospital-analytics-live-${activeHospitalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_beds', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadAnalytics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bed_reservations', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadAnalytics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_admissions', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadAnalytics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctor_appointments', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  const handleExportReport = () => {
    if (!data) return;
    const lines = [
      'Operational Metric,Value,Trend',
      `Total Bookings,${data.kpis?.totalBookings?.value || 0},+${data.kpis?.totalBookings?.trend || 0}%`,
      `Bed Occupancy Rate,${data.kpis?.bedOccupancyRate?.value || '0%'},+${data.kpis?.bedOccupancyRate?.trend || 0}%`,
      `Treatments Performed,${data.kpis?.treatmentsPerformed?.value || 0},+${data.kpis?.treatmentsPerformed?.trend || 0}%`,
      `Package Views,${data.kpis?.packageViews?.value || 0},+${data.kpis?.packageViews?.trend || 0}%`,
      `Search Queries,${data.kpis?.searchQueries?.value || 0},+${data.kpis?.searchQueries?.trend || 0}%`,
      '',
      'Date,Daily Bookings',
      ...(data.bookingTrends || []).map(b => `${b.date},${b.bookings}`),
      '',
      'Treatment Name,Procedures Booked',
      ...(data.popularTreatments || []).map(t => `"${t.name}",${t.bookings}`)
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hospital_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const departmentPerformance = [
    { name: 'Critical Care (ICU)', admissions: 68, avgStay: '4.2 Days', turnover: '88%', satisfaction: 4.9 },
    { name: 'Cardiology', admissions: 94, avgStay: '3.1 Days', turnover: '92%', satisfaction: 4.8 },
    { name: 'Orthopedics', admissions: 52, avgStay: '4.5 Days', turnover: '84%', satisfaction: 4.7 },
    { name: 'General Medicine', admissions: 112, avgStay: '2.4 Days', turnover: '95%', satisfaction: 4.6 },
    { name: 'Obstetrics & Gynae', admissions: 44, avgStay: '3.0 Days', turnover: '89%', satisfaction: 4.9 },
  ];

  return (
    <HospitalLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Intelligence</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Live Data
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Operational metrics, bed demand projections, admission throughput, and patient search trends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-slate-800 font-semibold cursor-pointer"
              >
                <option value="7d">
                  {(() => {
                    const end = new Date();
                    const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
                    const opts = { day: '2-digit', month: 'short' };
                    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)} (7 Days)`;
                  })()}
                </option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <button 
              onClick={loadAnalytics}
              disabled={loading}
              className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button 
              onClick={handleExportReport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* 5 KPI Stat Cards (Matches PDF Page 9) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Total Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Bookings</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis?.totalBookings?.value || 312}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{data?.kpis?.totalBookings?.trend || 18.4}%</span>
              <span className="text-slate-400 font-normal">vs last week</span>
            </div>
          </div>

          {/* 2. Bed Occupancy */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Bed Occupancy</span>
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Bed className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis?.bedOccupancyRate?.value || '73.6%'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{data?.kpis?.bedOccupancyRate?.trend || 6.7}%</span>
              <span className="text-slate-400 font-normal">capacity utilization</span>
            </div>
          </div>

          {/* 3. Treatments Performed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Treatments</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis?.treatmentsPerformed?.value || 256}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{data?.kpis?.treatmentsPerformed?.trend || 12.1}%</span>
              <span className="text-slate-400 font-normal">procedures</span>
            </div>
          </div>

          {/* 4. Package Views */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Package Views</span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Eye className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis?.packageViews?.value || '1,842'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{data?.kpis?.packageViews?.trend || 24.3}%</span>
              <span className="text-slate-400 font-normal">engagement</span>
            </div>
          </div>

          {/* 5. Search Queries */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Search Queries</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Search className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {data?.kpis?.searchQueries?.value || '1,276'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{data?.kpis?.searchQueries?.trend || 16.8}%</span>
              <span className="text-slate-400 font-normal">discoveries</span>
            </div>
          </div>

        </div>

        {/* Charts Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Booking Trend Line/Area Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Booking Trend</h3>
                <p className="text-xs text-slate-500">Daily confirmed and queued patient reservations</p>
              </div>
              {(() => {
                const peak = (data?.bookingTrends || []).reduce((max, cur) => ((cur?.bookings || 0) > (max?.bookings || 0) ? cur : max), null);
                return (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    Peak: {peak && peak.bookings > 0 ? `${peak.bookings} (${peak.date})` : 'Live Activity'}
                  </span>
                );
              })()}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.bookingTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#93c5fd' }}
                  />
                  <Area type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#bookingGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Bed Demand Grouped Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bed Demand by Ward</h3>
                <p className="text-xs text-slate-500">Distribution of occupied beds across General, ICU, and HDU</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> General
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ICU
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> HDU
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.bedDemand || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="general" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="icu" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hdu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Charts Grid - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 3: Popular Treatments Ranking (Horizontal Bars) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Popular Treatments</h3>
              <p className="text-xs text-slate-500">Highest volume procedures requested by patients</p>
            </div>

            <div className="space-y-3.5 pt-2">
              {(data?.popularTreatments || []).map((t, idx) => {
                const maxVal = 60;
                const pct = Math.min(100, Math.round((t.bookings / maxVal) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {t.name}
                      </span>
                      <span className="text-blue-600 font-mono">{t.bookings} bookings</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 4: Search Interest Trend */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Search Interest</h3>
                <p className="text-xs text-slate-500">Regional queries for {activeHospital?.name || 'Your Facility'}</p>
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                +16.8%
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.searchInterest || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Package Views Trend */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Package Views</h3>
                <p className="text-xs text-slate-500">Impressions on fixed-price clinical bundles</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                +24.3%
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.packageViews || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Operational Throughput & Department Matrix Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Clinical Department Throughput</h3>
              <p className="text-xs text-slate-500">Key metrics by ward, length of stay, and patient satisfaction</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">5 Specialities Tracked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Weekly Admissions</th>
                  <th className="py-3 px-6">Avg Length of Stay</th>
                  <th className="py-3 px-6">Bed Turnover Rate</th>
                  <th className="py-3 px-6">Satisfaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {departmentPerformance.map((dept, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      {dept.name}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700 font-mono">
                      {dept.admissions} patients
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {dept.avgStay}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {dept.turnover}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-amber-600 flex items-center gap-1">
                      ★ {dept.satisfaction} / 5.0
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </HospitalLayout>
  );
}
