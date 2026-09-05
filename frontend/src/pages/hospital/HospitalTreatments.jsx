import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Plus, 
  Download, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  X,
  Activity,
  Layers,
  IndianRupee,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalTreatments() {
  const navigate = useNavigate();
  const { activeHospitalId } = useHospital();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedTreatmentModal, setSelectedTreatmentModal] = useState(null);
  const [editTreatmentModal, setEditTreatmentModal] = useState(null);
  const [addTreatmentModalOpen, setAddTreatmentModalOpen] = useState(false);
  
  const [newTreatmentForm, setNewTreatmentForm] = useState({
    treatment_id: '',
    estimated_min_cost: 25000,
    estimated_max_cost: 45000
  });

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getTreatments(activeHospitalId);
      setData(res);
    } catch (e) {
      console.warn('Failed to load treatments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatments();

    if (!activeHospitalId) return;

    // Realtime CDC subscription for hospital treatments
    const channel = supabase
      .channel(`hospital-treatments-${activeHospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_treatments',
          filter: `hospital_id=eq.${activeHospitalId}`
        },
        () => {
          loadTreatments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  const filteredTreatments = (data?.treatments || []).filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) || 
        t.department.toLowerCase().includes(q) || 
        t.sub.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    if (!newTreatmentForm.treatment_id || !activeHospitalId) return;
    try {
      let effectiveTreatmentId = newTreatmentForm.treatment_id;

      if (effectiveTreatmentId === '__custom__' && newTreatmentForm.customTreatmentName?.trim()) {
        const { data: newTreat, error: treatErr } = await supabase
          .from('treatments')
          .insert({
            name: newTreatmentForm.customTreatmentName.trim(),
            category: newTreatmentForm.customCategory?.trim() || 'General Specialty',
            description: 'Hospital added custom procedure',
            is_active: true
          })
          .select()
          .single();
        if (treatErr) throw treatErr;
        effectiveTreatmentId = newTreat.id;
      }

      await hospitalPortalService.addTreatment({
        hospital_id: activeHospitalId,
        treatment_id: effectiveTreatmentId,
        estimated_min_cost: Number(newTreatmentForm.estimated_min_cost) || 10000,
        estimated_max_cost: Number(newTreatmentForm.estimated_max_cost) || 25000,
        available: true
      });
      setAddTreatmentModalOpen(false);
      setNewTreatmentForm({ treatment_id: '', customTreatmentName: '', customCategory: '', estimated_min_cost: 25000, estimated_max_cost: 45000 });
      await loadTreatments();
    } catch (err) {
      console.error('Failed to create treatment:', err);
      alert('Error creating treatment: ' + (err.message || 'Server error'));
    }
  };

  const handleEditTreatmentSubmit = async (e) => {
    e.preventDefault();
    if (!editTreatmentModal) return;
    try {
      await hospitalPortalService.updateTreatment(editTreatmentModal.id, {
        estimated_min_cost: Number(editTreatmentModal.minCost),
        estimated_max_cost: Number(editTreatmentModal.maxCost),
        available: Boolean(editTreatmentModal.available)
      });
      setEditTreatmentModal(null);
      await loadTreatments();
    } catch (err) {
      console.error('Failed to update treatment:', err);
      alert('Error updating treatment: ' + (err.message || 'Server error'));
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await hospitalPortalService.toggleTreatmentAvailability(id);
      await loadTreatments();
    } catch (err) {
      console.error('Failed to toggle treatment availability:', err);
    }
  };

  const handleDeleteTreatment = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || 'this procedure'} from the hospital offerings?`)) return;
    try {
      await hospitalPortalService.deleteTreatment(id);
      await loadTreatments();
    } catch (err) {
      console.error('Failed to delete treatment:', err);
      alert('Error removing treatment: ' + (err.message || 'Server error'));
    }
  };

  const totalTreatments = data?.kpis?.total || 0;
  const activeTreatments = data?.kpis?.active || 0;
  const categoriesList = data?.categories || [];
  const circumference = 2 * Math.PI * 14;
  let accumulatedPercent = 0;

  // Top 5 treatments by estimated volume
  const top5 = (data?.treatments || [])
    .slice()
    .sort((a, b) => b.bookingsThisMonth - a.bookingsThisMonth)
    .slice(0, 5);

  return (
    <HospitalLayout>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* =================================================================== */}
        {/* 1. HEADER & ACTIONS */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/hospital/dashboard')}>Dashboard</span>
              <span>›</span>
              <span className="text-slate-700">Treatments</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Treatments & Procedures
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage hospital surgical procedures, price tariffs, and transparent medical packages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const csvRows = [
                  ['Treatment Name', 'Category', 'Department', 'Duration', 'Min Cost (INR)', 'Max Cost (INR)', 'Status'],
                  ...(data?.treatments || []).map(t => [t.name, t.category, t.department, t.duration, t.minCost, t.maxCost, t.status])
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Treatments_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setAddTreatmentModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Procedure</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. TOP 5 KPI CARDS */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Treatments</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{data?.kpis?.total ?? 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Listed in Tariff</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Procedures</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{data?.kpis?.active ?? 0}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              {totalTreatments > 0 ? Math.round(((data?.kpis?.active || 0) / totalTreatments) * 100) : 100}% Available
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialty Domains</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{data?.kpis?.categories ?? 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Clinical Specialties</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg. Procedure Cost</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">₹{(data?.kpis?.avgCost || 0).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Across All Offerings</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bookings / Month</span>
            <span className="text-2xl font-black text-blue-600 mt-0.5 block">{data?.kpis?.totalBookings ?? 0}</span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-1">Verified Inquiries</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. MAIN SECTION: TABLE (70%) + STATS (30%) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Treatments Table (8 cols / 70%) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                  >
                    <option value="all">All Categories</option>
                    {categoriesList.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search procedure name..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Treatment / Procedure</th>
                      <th className="py-2.5 px-2">Category</th>
                      <th className="py-2.5 px-2 text-right">Tariff Range (₹)</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-center">Bookings</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {loading && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Loading treatments from database...
                        </td>
                      </tr>
                    )}
                    {!loading && filteredTreatments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No treatments found matching search.
                        </td>
                      </tr>
                    )}
                    {filteredTreatments.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-2">
                          <span className="font-extrabold text-slate-900 block">{t.name}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[220px] block">{t.sub}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-700 font-semibold">{t.category}</td>
                        <td className="py-3 px-2 text-right font-black text-slate-900 whitespace-nowrap">
                          ₹{t.minCost.toLocaleString('en-IN')} - ₹{t.maxCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(t.id)}
                            title="Click to toggle availability"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              t.available
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {t.available ? '● Available' : '○ Inactive'}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-900">{t.bookingsThisMonth}</td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setSelectedTreatmentModal(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" title="View Details">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setEditTreatmentModal({ ...t })} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" title="Edit Pricing">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteTreatment(t.id, t.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Remove Treatment">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination & Live status */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong>{filteredTreatments.length}</strong> of <strong>{totalTreatments}</strong> treatments</span>
              <span className="text-[11px] font-semibold text-slate-400">Database Live Sync Active</span>
            </div>
          </div>

          {/* Right Column: Donut + Top 5 + Quick Actions (4 cols / 30%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. Treatments by Category Donut Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col items-center">
              <h3 className="w-full text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Treatments by Category
              </h3>

              <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  {categoriesList.map((c) => {
                    const strokeDash = (c.percentage / 100) * circumference;
                    const strokeOffset = -((accumulatedPercent / 100) * circumference);
                    accumulatedPercent += c.percentage;
                    return (
                      <circle
                        key={c.name}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke={c.color}
                        strokeWidth="4"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-tight">{totalTreatments}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Procedures</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 mt-4 text-xs font-semibold">
                {categoriesList.map(c => (
                  <div key={c.name} className="flex justify-between text-slate-700">
                    <span className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-bold shrink-0">{c.count} ({c.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Procedures by Volume Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Top Treatments by Inquiries
              </h3>

              <div className="flex flex-col gap-2.5 mt-3 text-xs">
                {top5.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center text-slate-700">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 font-black text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    <strong className="text-slate-900 shrink-0">{item.bookingsThisMonth}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Quick Actions
              </h3>

              <div className="flex flex-col gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setAddTreatmentModalOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-slate-700 hover:text-blue-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-blue-600" /> Add New Treatment</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hospital/packages')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-indigo-600" /> View Fixed Price Packages</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Add New Treatment Modal */}
      {addTreatmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Add Procedure Tariff</h3>
                <p className="text-[11px] text-slate-400">Add verified medical procedure to hospital catalog</p>
              </div>
              <button type="button" onClick={() => setAddTreatmentModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTreatment} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Procedure / Treatment *</label>
                <select
                  required
                  value={newTreatmentForm.treatment_id}
                  onChange={e => setNewTreatmentForm({ ...newTreatmentForm, treatment_id: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:border-blue-500 outline-hidden"
                >
                  <option value="">Select Treatment from Catalog</option>
                  {(data?.catalog || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                  ))}
                  <option value="__custom__">✨ Custom (Add your own procedure)</option>
                </select>

                {newTreatmentForm.treatment_id === '__custom__' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2 animate-fadeIn">
                    <div>
                      <label className="text-[9px] font-bold text-blue-700 uppercase block">Custom Procedure / Surgery Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Minimally Invasive Lumbar Microdiscectomy"
                        value={newTreatmentForm.customTreatmentName || ''}
                        onChange={e => setNewTreatmentForm({ ...newTreatmentForm, customTreatmentName: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border border-blue-300 bg-white font-bold text-slate-900 text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-blue-700 uppercase block">Procedure Clinical Specialty</label>
                      <input
                        type="text"
                        placeholder="e.g. Neurosurgery / Spine Surgery"
                        value={newTreatmentForm.customCategory || ''}
                        onChange={e => setNewTreatmentForm({ ...newTreatmentForm, customCategory: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border border-blue-300 bg-white font-medium text-slate-800 text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newTreatmentForm.estimated_min_cost}
                    onChange={e => setNewTreatmentForm({ ...newTreatmentForm, estimated_min_cost: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Max Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newTreatmentForm.estimated_max_cost}
                    onChange={e => setNewTreatmentForm({ ...newTreatmentForm, estimated_max_cost: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTreatmentModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Add to Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Treatment Modal */}
      {editTreatmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Tariff Range</h3>
                <p className="text-[11px] text-slate-400 font-medium">{editTreatmentModal.name}</p>
              </div>
              <button type="button" onClick={() => setEditTreatmentModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditTreatmentSubmit} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Min Cost (₹)</label>
                  <input
                    type="number"
                    value={editTreatmentModal.minCost}
                    onChange={e => setEditTreatmentModal({ ...editTreatmentModal, minCost: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Max Cost (₹)</label>
                  <input
                    type="number"
                    value={editTreatmentModal.maxCost}
                    onChange={e => setEditTreatmentModal({ ...editTreatmentModal, maxCost: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div className="py-2 border-y border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editTreatmentModal.available)}
                    onChange={e => setEditTreatmentModal({ ...editTreatmentModal, available: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span>Active & Available for Inquiries</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTreatmentModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Save Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Treatment Modal */}
      {selectedTreatmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">{selectedTreatmentModal.name}</h3>
              <button type="button" onClick={() => setSelectedTreatmentModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs py-2 border-y border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-slate-900">{selectedTreatmentModal.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="font-semibold text-slate-700 text-right max-w-[200px]">{selectedTreatmentModal.sub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Tariff:</span>
                <span className="font-black text-emerald-600 text-sm">
                  ₹{selectedTreatmentModal.minCost.toLocaleString('en-IN')} - ₹{selectedTreatmentModal.maxCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${selectedTreatmentModal.available ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {selectedTreatmentModal.available ? 'Active in Marketplace' : 'Temporarily Unavailable'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const t = selectedTreatmentModal;
                  setSelectedTreatmentModal(null);
                  setEditTreatmentModal({ ...t });
                }}
                className="w-1/2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
              >
                Edit Tariff
              </button>
              <button
                type="button"
                onClick={() => setSelectedTreatmentModal(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </HospitalLayout>
  );
}
