import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BedDouble, 
  Plus, 
  Download, 
  Search, 
  Eye, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  AlertCircle,
  RotateCw,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalBeds() {
  const navigate = useNavigate();
  const { activeHospital, activeHospitalId, refreshHospital } = useHospital();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBedModal, setSelectedBedModal] = useState(null);
  const [addBedModalOpen, setAddBedModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form states
  const [editCountsForm, setEditCountsForm] = useState({
    total_beds: 0,
    occupied_beds: 0,
    reserved_beds: 0,
    available_beds: 0,
    price_per_day: 1500
  });

  const [newBedForm, setNewBedForm] = useState({
    bedTypeId: '',
    totalBeds: 20,
    occupiedBeds: 0,
    reservedBeds: 0,
    price_per_day: 1500
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadBeds = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getBeds(activeHospitalId);
      setData(res);
      if (res?.bedTypesCatalog?.length > 0 && !newBedForm.bedTypeId) {
        setNewBedForm(prev => ({ ...prev, bedTypeId: res.bedTypesCatalog[0].id }));
      }
    } catch (e) {
      console.warn('Failed to load beds:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();

    if (!activeHospitalId) return;

    // Realtime channel for live sync with PostgreSQL
    const channel = supabase
      .channel(`hospital_portal_beds_${activeHospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_beds',
          filter: `hospital_id=eq.${activeHospitalId}`
        },
        (payload) => {
          console.log('[HospitalBeds] Live change received from PostgreSQL:', payload);
          loadBeds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  // Open Edit Modal for a Bed Category
  const handleOpenEdit = (bed) => {
    setSelectedBedModal(bed);
    setEditCountsForm({
      total_beds: bed.total_beds || 0,
      occupied_beds: bed.occupied_beds || 0,
      reserved_beds: bed.reserved_beds || 0,
      available_beds: bed.available_beds || 0,
      price_per_day: bed.price_per_day || bed.rate || 1500
    });
  };

  // Live calculation of available beds in edit form
  const handleCountChange = (field, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    const updated = { ...editCountsForm, [field]: num };
    
    // Auto-calculate available beds
    const avail = Math.max(0, updated.total_beds - updated.occupied_beds - updated.reserved_beds);
    updated.available_beds = avail;
    setEditCountsForm(updated);
  };

  // Save Bed Count Changes to Live Database
  const handleSaveBedCounts = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBedModal) return;

    // Validate bed inventory invariant before submitting
    if (editCountsForm.occupied_beds + editCountsForm.reserved_beds > editCountsForm.total_beds) {
      setErrorMessage(`Occupied beds (${editCountsForm.occupied_beds}) + reserved holds (${editCountsForm.reserved_beds}) cannot exceed total capacity (${editCountsForm.total_beds}).`);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await hospitalPortalService.updateBedCounts(selectedBedModal.id, {
        total_beds: editCountsForm.total_beds,
        occupied_beds: editCountsForm.occupied_beds,
        reserved_beds: editCountsForm.reserved_beds,
        available_beds: editCountsForm.available_beds,
        price_per_day: Number(editCountsForm.price_per_day) || 1500
      });

      if (refreshHospital) refreshHospital();
      showToast(`Updated ${selectedBedModal.name} inventory! Live synced with Patient Marketplace.`);
      setSelectedBedModal(null);
      await loadBeds();
    } catch (err) {
      console.error('Failed to update bed counts:', err);
      setErrorMessage(err.message || 'Failed to save bed counts. Please check inputs.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Increment / Decrement Occupancy directly
  const handleQuickAdjust = async (bed, changeType) => {
    try {
      let occ = Number(bed.occupied_beds) || 0;
      let resv = Number(bed.reserved_beds) || 0;
      const tot = Number(bed.total_beds) || 0;

      if (changeType === 'intake' && occ + resv < tot) {
        occ += 1;
      } else if (changeType === 'discharge' && occ > 0) {
        occ -= 1;
      } else {
        return;
      }

      const avail = Math.max(0, tot - occ - resv);
      await hospitalPortalService.updateBedCounts(bed.id, {
        total_beds: tot,
        occupied_beds: occ,
        reserved_beds: resv,
        available_beds: avail
      });

      if (refreshHospital) refreshHospital();
      showToast(`${bed.name}: ${changeType === 'intake' ? 'Patient admitted (+1 Occupied)' : 'Patient discharged (-1 Occupied)'}.`);
      await loadBeds();
    } catch (err) {
      console.error('Quick adjust error:', err);
    }
  };

  // Add New Bed Category from Catalog
  const handleAddBedCategory = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      const total = Number(newBedForm.totalBeds) || 20;
      const occupied = Number(newBedForm.occupiedBeds) || 0;
      const reserved = Number(newBedForm.reservedBeds) || 0;

      let effectiveBedTypeId = newBedForm.bedTypeId;
      if (effectiveBedTypeId === '__custom__' && newBedForm.customBedTypeName?.trim()) {
        const { data: newType, error: typeErr } = await supabase
          .from('bed_types')
          .insert({
            name: newBedForm.customBedTypeName.trim(),
            description: newBedForm.customBedTypeDesc?.trim() || 'Custom care bed',
            is_active: true
          })
          .select()
          .single();
        if (typeErr) throw typeErr;
        effectiveBedTypeId = newType.id;
      }

      await hospitalPortalService.saveBedCategory(
        activeHospitalId,
        effectiveBedTypeId,
        total,
        occupied,
        reserved,
        Number(newBedForm.price_per_day) || 1500
      );

      if (refreshHospital) refreshHospital();
      showToast('New bed category configured and synced to Patient Marketplace!');
      setAddBedModalOpen(false);
      setNewBedForm({
        bedTypeId: data?.bedTypesCatalog?.[0]?.id || '',
        customBedTypeName: '',
        customBedTypeDesc: '',
        totalBeds: 20,
        occupiedBeds: 0,
        reservedBeds: 0,
        price_per_day: 1500
      });
      await loadBeds();
    } catch (err) {
      console.error('Failed to add bed category:', err);
      setErrorMessage(err.message || 'Failed to create bed category.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Bed Category
  const handleDeleteBed = async (bedId, bedName) => {
    if (!window.confirm(`Are you sure you want to remove the ${bedName} category from live inventory?`)) return;
    try {
      await hospitalPortalService.deleteBedCategory(bedId);
      if (refreshHospital) refreshHospital();
      showToast(`Removed ${bedName} from inventory.`);
      await loadBeds();
    } catch (err) {
      console.error('Failed to delete bed category:', err);
    }
  };

  // KPI calculations
  const totalBeds = data?.kpis?.total || 0;
  const availableBeds = data?.kpis?.available || 0;
  const occupiedBeds = data?.kpis?.occupied || 0;
  const reservedBeds = data?.kpis?.reserved || 0;

  const availPct = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
  const occPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const resvPct = totalBeds > 0 ? Math.round((reservedBeds / totalBeds) * 100) : 0;

  // Filter beds list
  const filteredBeds = (data?.beds || []).filter(b => {
    if (activeTab !== 'all') {
      const matchTab = b.bedType.toLowerCase() === activeTab.toLowerCase() || b.name.toLowerCase().includes(activeTab.toLowerCase());
      if (!matchTab) return false;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'available' && b.available_beds <= 0) return false;
      if (statusFilter === 'occupied' && b.occupied_beds <= 0) return false;
      if (statusFilter === 'full' && b.available_beds > 0) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.department.toLowerCase().includes(q) || b.bedNumber.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <HospitalLayout>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Success Feedback Notification Banner */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 rounded-2xl bg-emerald-600 text-white flex items-center justify-between text-xs font-bold shadow-lg shadow-emerald-600/20"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                <span>{toastMsg}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setToastMsg(null)} 
                className="p-1 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================================== */}
        {/* 1. HEADER & ACTIONS (Page 3 in PDF) */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/hospital/dashboard')}>Dashboard</span>
              <span>›</span>
              <span className="text-slate-700">Beds</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Beds Management</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Supabase Sync
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Manage and track real-time bed inventory. Any change updates the Patient Marketplace instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadBeds}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
              title="Refresh live data"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setAddBedModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bed Category</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. TOP SUMMARY STRIP (Category Pills Left + 5 Live Stat Cards Right) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          
          {/* Category Overview Pills on Left (4 cols) */}
          <div className="xl:col-span-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Live Bed Categories</span>
              <span className="text-[10px] font-bold text-emerald-600">● Real-time</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              {data?.categories && data.categories.length > 0 ? (
                data.categories.map((cat) => {
                  const isICU = cat.name.toLowerCase().includes('icu');
                  const isHDU = cat.name.toLowerCase().includes('hdu');
                  const pct = totalBeds > 0 ? ((cat.total / totalBeds) * 100).toFixed(0) : 0;
                  return (
                    <div 
                      key={cat.id} 
                      className={`p-2.5 rounded-xl border flex flex-col justify-between text-left ${
                        isICU 
                          ? 'bg-rose-50/60 border-rose-100 text-rose-950' 
                          : isHDU 
                          ? 'bg-amber-50/60 border-amber-100 text-amber-950' 
                          : 'bg-blue-50/60 border-blue-100 text-blue-950'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-600 block truncate">{cat.name}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-base font-black text-slate-900">{cat.total}</span>
                        <span className="text-[10px] font-extrabold text-emerald-700">{cat.available} Vacant</span>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 mt-0.5">{pct}% of total</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-3 text-xs text-slate-400 font-medium">
                  Loading categories...
                </div>
              )}
            </div>
          </div>

          {/* 5 Live Stat Cards on Right (8 cols) */}
          <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            
            {/* Total Beds */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Beds</span>
              <span className="text-2xl font-black text-slate-900 my-1 block">{totalBeds}</span>
              <span className="text-[10px] text-slate-500 font-semibold">Configured Capacity</span>
            </div>

            {/* Available Beds */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Beds</span>
              <span className="text-2xl font-black text-emerald-600 my-1 block">{availableBeds}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
                {availPct}% Available
              </span>
            </div>

            {/* Occupied Beds */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupied Beds</span>
              <span className="text-2xl font-black text-slate-900 my-1 block">{occupiedBeds}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{occPct}% Occupancy</span>
            </div>

            {/* Reserved Beds */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Reserved Beds</span>
              <span className="text-2xl font-black text-amber-600 my-1 block">{reservedBeds}</span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded w-fit">
                {resvPct}% Active Holds
              </span>
            </div>

            {/* Occupancy Rate */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs col-span-2 sm:col-span-1 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Occupancy Rate</span>
              <span className="text-2xl font-black text-blue-600 my-1 block">{data?.kpis?.occupancyRate || '0%'}</span>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                Ward Efficiency
              </span>
            </div>

          </div>

        </div>

        {/* =================================================================== */}
        {/* 3. DYNAMIC SUB-TABS */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-bold text-slate-500 pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            All Beds ({data?.beds?.length || 0})
          </button>

          {data?.categories?.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.name.toLowerCase())}
              className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === cat.name.toLowerCase()
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {cat.name} ({cat.total})
            </button>
          ))}
        </div>

        {/* =================================================================== */}
        {/* 4. MAIN 2-COLUMN SECTION: TABLE (70%) + SUMMARY SIDEBAR (30%)       */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Table Section (8 cols / 70%) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 outline-none"
                  >
                    <option value="all">All Availability</option>
                    <option value="available">Has Vacant Beds</option>
                    <option value="occupied">Has Inpatients</option>
                    <option value="full">Full / No Vacancy</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search ward or category..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Beds Table */}
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Ward / Category</th>
                      <th className="py-2.5 px-2 text-center">Total Beds</th>
                      <th className="py-2.5 px-2 text-center">Occupied</th>
                      <th className="py-2.5 px-2 text-center">Reserved</th>
                      <th className="py-2.5 px-2 text-center">Available</th>
                      <th className="py-2.5 px-2">Daily Tariff</th>
                      <th className="py-2.5 px-2">Last Updated</th>
                      <th className="py-2.5 px-2 text-right">Quick Floor Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {filteredBeds.length > 0 ? (
                      filteredBeds.map((bed) => {
                        const isICU = bed.name.toLowerCase().includes('icu');
                        const isHDU = bed.name.toLowerCase().includes('hdu');
                        return (
                          <tr key={bed.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isICU ? 'bg-rose-50 text-rose-600' : isHDU ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  <BedDouble className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block">{bed.name}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">{bed.department}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-slate-900">{bed.total_beds}</td>
                            <td className="py-3 px-2 text-center font-semibold text-slate-700">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                                {bed.occupied_beds}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-amber-700">
                              {bed.reserved_beds > 0 ? (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                                  {bed.reserved_beds}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                                bed.available_beds > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {bed.available_beds} Vacant
                              </span>
                            </td>
                            <td className="py-3 px-2 font-mono font-bold text-slate-800">
                              ₹{bed.rate.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400">/day</span>
                            </td>
                            <td className="py-3 px-2 text-slate-400 whitespace-nowrap text-[11px]">
                              {bed.lastUpdated}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Admit (+1 Occupied) */}
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(bed, 'intake')}
                                  disabled={bed.available_beds <= 0}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-30 cursor-pointer"
                                  title="Admit Patient (+1 Occupied)"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>

                                {/* Quick Discharge (-1 Occupied) */}
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(bed, 'discharge')}
                                  disabled={bed.occupied_beds <= 0}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-600 hover:text-amber-600 transition-colors disabled:opacity-30 cursor-pointer"
                                  title="Discharge Patient (-1 Occupied)"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>

                                {/* Full Edit Counts */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(bed)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                                  title="Edit Bed Counts"
                                >
                                  <Edit3 className="w-3 h-3 inline mr-1" />
                                  <span>Edit</span>
                                </button>

                                {/* Delete Category */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBed(bed.id, bed.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-xs text-slate-400 font-medium">
                          No bed categories matching the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination & Status Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredBeds.length} of {data?.beds?.length || 0} categories</span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Supabase PostgreSQL Roster</span>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar (4 cols / 30%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. Bed Status Distribution Donut Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col items-center">
              <div className="w-full flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Bed Status Distribution</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Database</span>
              </div>

              {/* Dynamic SVG Donut Chart */}
              <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  {/* Available arc (green) */}
                  <circle 
                    cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" 
                    strokeDasharray={`${availPct} ${100 - availPct}`} 
                    strokeDashoffset={0} 
                  />
                  {/* Occupied arc (red) */}
                  <circle 
                    cx="18" cy="18" r="14" fill="transparent" stroke="#ef4444" strokeWidth="4" 
                    strokeDasharray={`${occPct} ${100 - occPct}`} 
                    strokeDashoffset={-availPct} 
                  />
                  {/* Reserved arc (amber) */}
                  <circle 
                    cx="18" cy="18" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="4" 
                    strokeDasharray={`${resvPct} ${100 - resvPct}`} 
                    strokeDashoffset={-(availPct + occPct)} 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-tight">{totalBeds}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Total Beds</span>
                </div>
              </div>

              {/* Dynamic Legend with percentages */}
              <div className="w-full flex flex-col gap-2 mt-4 text-xs font-semibold">
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Available</span>
                  </div>
                  <span className="font-bold text-emerald-700">{availableBeds} ({availPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Occupied</span>
                  </div>
                  <span className="font-bold text-slate-900">{occupiedBeds} ({occPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Reserved</span>
                  </div>
                  <span className="font-bold text-amber-700">{reservedBeds} ({resvPct}%)</span>
                </div>
              </div>
            </div>

            {/* 2. Bed Type Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Bed Allocation Summary
              </h3>

              <div className="flex flex-col gap-2.5 mt-3 text-xs">
                {data?.categories?.map((cat) => {
                  const isICU = cat.name.toLowerCase().includes('icu');
                  const isHDU = cat.name.toLowerCase().includes('hdu');
                  const pct = totalBeds > 0 ? ((cat.total / totalBeds) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.id} className="flex justify-between items-center text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isICU ? 'bg-rose-500' : isHDU ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{cat.total} ({pct}%)</span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-slate-900">
                  <span>Total Configured</span>
                  <span>{totalBeds} (100%)</span>
                </div>
              </div>
            </div>

            {/* 3. Patient Discovery Quick Verification */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-black text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Patient Panel Verification</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Patients viewing {activeHospital?.name || 'your hospital'} on the Marketplace see these exact counts in the "Check Live Beds" drawer and emergency reservation flow.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/hospitals')}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Patient Marketplace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Edit Bed Counts Modal */}
      {selectedBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Bed Counts: {selectedBedModal.name}</h3>
                <span className="text-[10px] text-slate-400 font-medium">Updates live inventory in PostgreSQL</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedBedModal(null)} 
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveBedCounts} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Total Configured Beds</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editCountsForm.total_beds}
                    onChange={e => handleCountChange('total_beds', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Daily Tariff (₹/day)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editCountsForm.price_per_day}
                    onChange={e => setEditCountsForm({ ...editCountsForm, price_per_day: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Occupied Beds (Inpatients)</label>
                  <input
                    type="number"
                    min="0"
                    max={editCountsForm.total_beds}
                    required
                    value={editCountsForm.occupied_beds}
                    onChange={e => handleCountChange('occupied_beds', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Reserved Beds (Holds)</label>
                  <input
                    type="number"
                    min="0"
                    max={editCountsForm.total_beds}
                    value={editCountsForm.reserved_beds}
                    onChange={e => handleCountChange('reserved_beds', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Calculated Available preview */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Available (Calculated Vacant)</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Total - Occupied - Reserved</span>
                </div>
                <span className="text-xl font-black text-emerald-700">
                  {editCountsForm.available_beds} Beds
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBedModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Saving...' : 'Update & Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Bed Category Modal */}
      {addBedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Add Bed Category</h3>
              <button 
                type="button" 
                onClick={() => setAddBedModalOpen(false)} 
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddBedCategory} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Bed Type</label>
                <select
                  value={newBedForm.bedTypeId}
                  onChange={e => setNewBedForm({ ...newBedForm, bedTypeId: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white outline-none focus:border-blue-500 focus:bg-white"
                >
                  {data?.bedTypesCatalog?.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.description})</option>
                  ))}
                  <option value="__custom__">✨ Custom (Add your own)</option>
                </select>

                {newBedForm.bedTypeId === '__custom__' && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2 animate-fadeIn">
                    <div>
                      <label className="text-[9px] font-bold text-blue-700 uppercase block">Custom Bed Type Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Burn Care ICU / Isolation Suite"
                        value={newBedForm.customBedTypeName || ''}
                        onChange={e => setNewBedForm({ ...newBedForm, customBedTypeName: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border border-blue-300 bg-white font-bold text-slate-900 text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-blue-700 uppercase block">Custom Bed Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Sterile barrier isolation room with HEPA ventilation"
                        value={newBedForm.customBedTypeDesc || ''}
                        onChange={e => setNewBedForm({ ...newBedForm, customBedTypeDesc: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border border-blue-300 bg-white font-medium text-slate-800 text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total Beds *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBedForm.totalBeds}
                    onChange={e => setNewBedForm({ ...newBedForm, totalBeds: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Daily Tariff (₹/day) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newBedForm.price_per_day}
                    onChange={e => setNewBedForm({ ...newBedForm, price_per_day: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Occupied</label>
                  <input
                    type="number"
                    min="0"
                    value={newBedForm.occupiedBeds}
                    onChange={e => setNewBedForm({ ...newBedForm, occupiedBeds: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Reserved</label>
                  <input
                    type="number"
                    min="0"
                    value={newBedForm.reservedBeds}
                    onChange={e => setNewBedForm({ ...newBedForm, reservedBeds: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddBedModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </HospitalLayout>
  );
}
