import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Download, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  X,
  IndianRupee,
  Calendar,
  Layers,
  CheckCircle2,
  Lock,
  Tag,
  CreditCard,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalPackages() {
  const navigate = useNavigate();
  const { activeHospitalId } = useHospital();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedPackageModal, setSelectedPackageModal] = useState(null);
  const [editPackageModal, setEditPackageModal] = useState(null);
  const [addPackageModalOpen, setAddPackageModalOpen] = useState(false);
  
  const [newPackageForm, setNewPackageForm] = useState({
    name: '',
    treatment_id: '',
    price: 35000,
    duration_days: 3,
    room_category: 'Semi-Private Room',
    customRoomCategory: '',
    included_services_str: 'Pre-op Diagnostics, OT Charges, Nursing Care, Standard Medicines',
    excluded_services_str: 'Special non-formulary medications, ICU stay beyond 24h, Implants',
    package_lock_available: true,
    emi_available: true
  });

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getPackages(activeHospitalId);
      setData(res);
    } catch (e) {
      console.warn('Failed to load packages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();

    if (!activeHospitalId) return;

    // Supabase Realtime CDC subscription on treatment_packages
    const channel = supabase
      .channel(`hospital-packages-${activeHospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'treatment_packages',
          filter: `hospital_id=eq.${activeHospitalId}`
        },
        () => {
          loadPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  const filteredPackages = (data?.packages || []).filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        p.sub.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddPackage = async (e) => {
    e.preventDefault();
    if (!newPackageForm.name || !activeHospitalId) return;
    try {
      const incList = newPackageForm.included_services_str
        ? newPackageForm.included_services_str.split(',').map(s => s.trim()).filter(Boolean)
        : ['Consultation', 'OT & Bed Charges', 'Standard Medication'];

      const excList = newPackageForm.excluded_services_str
        ? newPackageForm.excluded_services_str.split(',').map(s => s.trim()).filter(Boolean)
        : ['Special non-formulary medications', 'ICU stay beyond 24h'];

      const effectiveRoomCat = newPackageForm.room_category === '__custom__' 
        ? (newPackageForm.customRoomCategory?.trim() || 'Custom Suite') 
        : (newPackageForm.room_category || 'General Ward');

      await hospitalPortalService.addPackage({
        hospital_id: activeHospitalId,
        treatment_id: newPackageForm.treatment_id || null,
        name: newPackageForm.name,
        price: Number(newPackageForm.price) || 25000,
        duration_days: Number(newPackageForm.duration_days) || 2,
        room_category: effectiveRoomCat,
        included_services: incList,
        excluded_services: excList,
        package_lock_available: Boolean(newPackageForm.package_lock_available),
        emi_available: Boolean(newPackageForm.emi_available),
        active: true
      });
      setAddPackageModalOpen(false);
      setNewPackageForm({
        name: '',
        treatment_id: '',
        price: 35000,
        duration_days: 3,
        room_category: 'Semi-Private Room',
        customRoomCategory: '',
        included_services_str: 'Pre-op Diagnostics, OT Charges, Nursing Care, Standard Medicines',
        excluded_services_str: 'Special non-formulary medications, ICU stay beyond 24h, Implants',
        package_lock_available: true,
        emi_available: true
      });
      await loadPackages();
    } catch (err) {
      console.error('Failed to create package:', err);
      alert('Error creating package: ' + (err.message || 'Server error'));
    }
  };

  const handleEditPackageSubmit = async (e) => {
    e.preventDefault();
    if (!editPackageModal) return;
    try {
      await hospitalPortalService.updatePackage(editPackageModal.id, {
        name: editPackageModal.name,
        price: Number(editPackageModal.price),
        duration_days: Number(editPackageModal.duration_days),
        room_category: editPackageModal.room_category,
        included_services_str: editPackageModal.inclusions_str,
        excluded_services_str: editPackageModal.exclusions_str,
        package_lock_available: Boolean(editPackageModal.package_lock_available),
        emi_available: Boolean(editPackageModal.emi_available),
        active: Boolean(editPackageModal.active)
      });
      setEditPackageModal(null);
      await loadPackages();
    } catch (err) {
      console.error('Failed to update package:', err);
      alert('Error updating package: ' + (err.message || 'Server error'));
    }
  };

  const handleToggleActive = async (packageId) => {
    try {
      await hospitalPortalService.togglePackageActive(packageId);
      await loadPackages();
    } catch (err) {
      console.error('Failed to toggle package status:', err);
    }
  };

  const handleDeletePackage = async (packageId, name) => {
    if (!window.confirm(`Are you sure you want to remove the package "${name || 'this package'}"?`)) return;
    try {
      await hospitalPortalService.deletePackage(packageId);
      await loadPackages();
    } catch (err) {
      console.error('Failed to delete package:', err);
      alert('Error removing package: ' + (err.message || 'Server error'));
    }
  };

  const totalPackages = data?.kpis?.total || 0;
  const activePackages = data?.kpis?.active || 0;
  const packagesList = data?.packages || [];

  // Group packages by category dynamically
  const catMap = {};
  packagesList.forEach(p => {
    const cat = p.category || 'General Specialty';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
  let colIdx = 0;
  const categoryBreakdown = Object.entries(catMap).map(([name, count]) => {
    const pct = totalPackages > 0 ? ((count / totalPackages) * 100).toFixed(1) : 0;
    const color = colors[colIdx % colors.length];
    colIdx++;
    return { name, count, percentage: Number(pct), color };
  });

  const circumference = 2 * Math.PI * 14;
  let accumulatedPercent = 0;

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
              <span className="text-slate-700">Packages</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fixed Price Bundles & Packages
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Transparent, all-inclusive medical care packages with price lock guarantees and EMI options.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const csvRows = [
                  ['Package Name', 'Category', 'Room Type', 'Price (INR)', 'Duration', 'Price Lock', 'EMI Available', 'Status'],
                  ...packagesList.map(p => [
                    p.name, p.category, p.room_category, p.price, p.duration, p.package_lock_available ? 'Yes' : 'No', p.emi_available ? 'Yes' : 'No', p.status
                  ])
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Treatment_Packages_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setAddPackageModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Package</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. TOP 5 KPI CARDS */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Packages</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{totalPackages}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Active Bundles</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Status</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{activePackages}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              {totalPackages > 0 ? Math.round((activePackages / totalPackages) * 100) : 100}% Published
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Package Price</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">₹{(data?.kpis?.avgPrice || 0).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">All-Inclusive</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Price-Lock Ready</span>
            <span className="text-2xl font-black text-blue-600 mt-0.5 block">{data?.kpis?.packageLockAvailable ?? 0}</span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-1">No Hidden Extras</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">EMI Financing</span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">{data?.kpis?.emiAvailable ?? 0}</span>
            <span className="text-[10px] text-rose-600 font-semibold block mt-1">0% EMI Available</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. MAIN SECTION: TABLE (70%) + STATS (30%) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Table Section (8 cols / 70%) */}
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
                    {categoryBreakdown.map(c => (
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
                    placeholder="Search package name..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Package Name</th>
                      <th className="py-2.5 px-2">Room Type</th>
                      <th className="py-2.5 px-2 text-center">Duration</th>
                      <th className="py-2.5 px-2 text-right">Fixed Price (₹)</th>
                      <th className="py-2.5 px-2 text-center">Price Lock</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {loading && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Loading treatment packages...
                        </td>
                      </tr>
                    )}
                    {!loading && filteredPackages.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No treatment packages found.
                        </td>
                      </tr>
                    )}
                    {filteredPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-2">
                          <span className="font-extrabold text-slate-900 block">{pkg.name}</span>
                          <span className="text-[10px] text-slate-400">{pkg.inclusions}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-700">{pkg.room_category}</td>
                        <td className="py-3 px-2 text-center text-slate-600 whitespace-nowrap">{pkg.duration}</td>
                        <td className="py-3 px-2 text-right font-black text-slate-900 whitespace-nowrap">
                          ₹{pkg.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pkg.package_lock_available ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {pkg.package_lock_available ? 'Locked' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(pkg.id)}
                            title="Click to toggle package status"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              pkg.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {pkg.active ? '● Active' : '○ Inactive'}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setSelectedPackageModal(pkg)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" title="View Inclusions">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditPackageModal({
                                ...pkg,
                                inclusions_str: Array.isArray(pkg.included_services) ? pkg.included_services.join(', ') : '',
                                exclusions_str: Array.isArray(pkg.excluded_services) ? pkg.excluded_services.join(', ') : ''
                              })} 
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" 
                              title="Edit Package"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeletePackage(pkg.id, pkg.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Delete Package">
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
              <span>Showing <strong>{filteredPackages.length}</strong> of <strong>{totalPackages}</strong> packages</span>
              <span className="text-[11px] font-semibold text-slate-400">Database Live Sync Active</span>
            </div>
          </div>

          {/* Right Column: Donut + Quick Actions (4 cols / 30%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. Packages by Category Donut Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col items-center">
              <h3 className="w-full text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Packages by Category
              </h3>

              <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  {categoryBreakdown.map((c) => {
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
                  <span className="text-xl font-black text-slate-900 leading-tight">{totalPackages}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Bundles</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 mt-4 text-xs font-semibold">
                {categoryBreakdown.map(c => (
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

            {/* 2. Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Quick Actions
              </h3>

              <div className="flex flex-col gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setAddPackageModalOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-slate-700 hover:text-blue-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-blue-600" /> Create New Package</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hospital/beds')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-indigo-600" /> Manage Package Bed Allocation</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Add New Package Modal */}
      {addPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Create Fixed Package</h3>
                <p className="text-[11px] text-slate-400">All-inclusive pricing bundle with price-lock assurance</p>
              </div>
              <button type="button" onClick={() => setAddPackageModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Comprehensive Total Knee Replacement"
                  value={newPackageForm.name}
                  onChange={e => setNewPackageForm({ ...newPackageForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Room Category</label>
                  <select
                    value={newPackageForm.room_category}
                    onChange={e => setNewPackageForm({ ...newPackageForm, room_category: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:border-blue-500 focus:bg-white outline-hidden"
                  >
                    <option value="General Ward">General Ward</option>
                    <option value="Semi-Private Room">Semi-Private Room</option>
                    <option value="Private Deluxe Room">Private Deluxe Room</option>
                    <option value="Daycare Ward">Daycare Ward</option>
                    <option value="__custom__">✨ Custom (Add your own)</option>
                  </select>

                  {newPackageForm.room_category === '__custom__' && (
                    <div className="mt-1.5 animate-fadeIn">
                      <input
                        type="text"
                        required
                        placeholder="e.g. VIP Presidential Suite"
                        value={newPackageForm.customRoomCategory || ''}
                        onChange={e => setNewPackageForm({ ...newPackageForm, customRoomCategory: e.target.value })}
                        className="w-full p-2 rounded-xl border border-blue-300 bg-blue-50/40 font-bold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPackageForm.duration_days}
                    onChange={e => setNewPackageForm({ ...newPackageForm, duration_days: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fixed Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newPackageForm.price}
                  onChange={e => setNewPackageForm({ ...newPackageForm, price: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Included Services (Comma separated)</label>
                <textarea
                  rows={2}
                  value={newPackageForm.included_services_str}
                  onChange={e => setNewPackageForm({ ...newPackageForm, included_services_str: e.target.value })}
                  placeholder="Surgeon Fee, 3 Days Room Stay, Nursing, Standard Medicines"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Excluded Services / Out-of-pocket (Comma separated)</label>
                <textarea
                  rows={2}
                  value={newPackageForm.excluded_services_str}
                  onChange={e => setNewPackageForm({ ...newPackageForm, excluded_services_str: e.target.value })}
                  placeholder="Special non-formulary medications, ICU stay beyond 24h, Implants"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 py-2 border-y border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPackageForm.package_lock_available}
                    onChange={e => setNewPackageForm({ ...newPackageForm, package_lock_available: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>Package Lock Guaranteed</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPackageForm.emi_available}
                    onChange={e => setNewPackageForm({ ...newPackageForm, emi_available: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span>EMI Available</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddPackageModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Publish Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {editPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Package</h3>
                <p className="text-[11px] text-slate-400 font-medium">{editPackageModal.name}</p>
              </div>
              <button type="button" onClick={() => setEditPackageModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPackageSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Package Name</label>
                <input
                  type="text"
                  required
                  value={editPackageModal.name}
                  onChange={e => setEditPackageModal({ ...editPackageModal, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Room Category</label>
                  <input
                    type="text"
                    value={editPackageModal.room_category}
                    onChange={e => setEditPackageModal({ ...editPackageModal, room_category: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Duration (Days)</label>
                  <input
                    type="number"
                    value={editPackageModal.duration_days}
                    onChange={e => setEditPackageModal({ ...editPackageModal, duration_days: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fixed Price (₹)</label>
                <input
                  type="number"
                  value={editPackageModal.price}
                  onChange={e => setEditPackageModal({ ...editPackageModal, price: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Included Services (Comma separated)</label>
                <textarea
                  rows={2}
                  value={editPackageModal.inclusions_str || ''}
                  onChange={e => setEditPackageModal({ ...editPackageModal, inclusions_str: e.target.value })}
                  placeholder="Surgeon Fee, 3 Days Room Stay, Nursing, Standard Medicines"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Excluded Services / Out-of-pocket (Comma separated)</label>
                <textarea
                  rows={2}
                  value={editPackageModal.exclusions_str || ''}
                  onChange={e => setEditPackageModal({ ...editPackageModal, exclusions_str: e.target.value })}
                  placeholder="Special non-formulary medications, ICU stay beyond 24h, Implants"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 py-2 border-y border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editPackageModal.package_lock_available)}
                    onChange={e => setEditPackageModal({ ...editPackageModal, package_lock_available: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>Package Lock Guaranteed</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editPackageModal.emi_available)}
                    onChange={e => setEditPackageModal({ ...editPackageModal, emi_available: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span>EMI Available</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editPackageModal.active)}
                    onChange={e => setEditPackageModal({ ...editPackageModal, active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditPackageModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Package Inclusions Modal */}
      {selectedPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">{selectedPackageModal.name}</h3>
                <span className="text-xs text-blue-600 font-bold">{selectedPackageModal.room_category} • {selectedPackageModal.duration}</span>
              </div>
              <button type="button" onClick={() => setSelectedPackageModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Fixed Package Price:</span>
                <span className="text-xl font-black text-slate-900">₹{selectedPackageModal.price.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <h4 className="font-black text-slate-800 mb-2 uppercase text-[10px] tracking-wider">Included In Package</h4>
                <div className="flex flex-col gap-1.5">
                  {(selectedPackageModal.included_services || []).map((inc, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPackageModal.excluded_services?.length > 0 && (
                <div>
                  <h4 className="font-black text-slate-800 mb-2 uppercase text-[10px] tracking-wider">Excluded / Add-on Services</h4>
                  <div className="flex flex-col gap-1.5">
                    {selectedPackageModal.excluded_services.map((exc, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-400">
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{exc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const p = selectedPackageModal;
                  setSelectedPackageModal(null);
                  setEditPackageModal({
                    ...p,
                    inclusions_str: Array.isArray(p.included_services) ? p.included_services.join(', ') : '',
                    exclusions_str: Array.isArray(p.excluded_services) ? p.excluded_services.join(', ') : ''
                  });
                }}
                className="w-1/2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
              >
                Edit Package
              </button>
              <button
                type="button"
                onClick={() => setSelectedPackageModal(null)}
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
