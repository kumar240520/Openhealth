import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Plus, 
  Download, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  X,
  HeartPulse,
  Activity,
  Brain,
  Bone,
  Baby,
  UserCheck,
  Stethoscope,
  Siren,
  Users,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalDepartments() {
  const navigate = useNavigate();
  const { activeHospitalId } = useHospital();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeptModal, setSelectedDeptModal] = useState(null);
  const [editDeptModal, setEditDeptModal] = useState(null);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ name: '', description: '', emergency_available: false });

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getDepartments(activeHospitalId);
      setData(res);
    } catch (e) {
      console.warn('Failed to load departments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();

    if (!activeHospitalId) return;

    // Realtime CDC subscription for departments
    const channel = supabase
      .channel(`hospital-departments-${activeHospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
          filter: `hospital_id=eq.${activeHospitalId}`
        },
        () => {
          loadDepartments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  const getDeptIcon = (iconName) => {
    switch (iconName) {
      case 'HeartPulse': return <HeartPulse className="w-4 h-4 text-rose-500" />;
      case 'Brain': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'Bone': return <Bone className="w-4 h-4 text-amber-500" />;
      case 'Baby': return <Baby className="w-4 h-4 text-teal-500" />;
      case 'UserCheck': return <UserCheck className="w-4 h-4 text-pink-500" />;
      case 'Siren': return <Siren className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredDepts = (data?.departments || []).filter(d => {
    if (statusFilter !== 'all' && d.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) || 
        (d.subtitle && d.subtitle.toLowerCase().includes(q)) || 
        (d.head && d.head.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptForm.name || !activeHospitalId) return;
    try {
      await hospitalPortalService.addDepartment({
        hospital_id: activeHospitalId,
        name: newDeptForm.name,
        description: newDeptForm.description || 'Clinical Specialty Department',
        emergency_available: Boolean(newDeptForm.emergency_available),
        is_active: true
      });
      setAddDeptModalOpen(false);
      setNewDeptForm({ name: '', description: '', emergency_available: false });
      await loadDepartments();
    } catch (err) {
      console.error('Failed to add department:', err);
      alert('Error creating department: ' + (err.message || 'Server error'));
    }
  };

  const handleEditDeptSubmit = async (e) => {
    e.preventDefault();
    if (!editDeptModal) return;
    try {
      await hospitalPortalService.updateDepartment(editDeptModal.id, {
        name: editDeptModal.name,
        description: editDeptModal.subtitle || editDeptModal.description,
        emergency_available: Boolean(editDeptModal.emergency_available),
        is_active: Boolean(editDeptModal.is_active)
      });
      setEditDeptModal(null);
      await loadDepartments();
    } catch (err) {
      console.error('Failed to update department:', err);
      alert('Error updating department: ' + (err.message || 'Server error'));
    }
  };

  const handleDeleteDept = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to remove the ${deptName || 'selected'} department?`)) return;
    try {
      await hospitalPortalService.deleteDepartment(deptId);
      await loadDepartments();
    } catch (err) {
      console.error('Failed to delete department:', err);
      alert('Error deleting department: ' + (err.message || 'Server error'));
    }
  };

  const totalDepts = data?.kpis?.total || 0;
  const activeDepts = data?.kpis?.active || 0;
  const emergencyDepts = data?.kpis?.emergency || 0;
  const clinicalDepts = data?.kpis?.clinical || 0;
  const circumference = 2 * Math.PI * 14;

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
              <span className="text-slate-700">Departments</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Clinical Departments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage specialized departments, emergency facilities, and clinical team allocation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const csvRows = [
                  ['Department Name', 'Code', 'Type', 'Head of Department', 'Doctors Count', 'Status'],
                  ...(data?.departments || []).map(d => [d.name, d.code, d.type, d.head, d.doctors, d.status])
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Departments_${new Date().toISOString().split('T')[0]}.csv`);
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
              onClick={() => setAddDeptModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. TOP 5 KPI CARDS */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Departments</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{data?.kpis?.total ?? 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Configured in Hospital</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Departments</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{data?.kpis?.active ?? 0}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              {totalDepts > 0 ? Math.round(((data?.kpis?.active || 0) / totalDepts) * 100) : 100}% Active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
              <Siren className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Ready</span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">{data?.kpis?.emergency ?? 0}</span>
            <span className="text-[10px] text-rose-600 font-semibold block mt-1">24/7 Critical Units</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Staff</span>
            <span className="text-2xl font-black text-indigo-600 mt-0.5 block">{data?.kpis?.staff ?? 0}</span>
            <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Doctors & Nursing</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg. Patients / Day</span>
            <span className="text-2xl font-black text-purple-600 mt-0.5 block">{data?.kpis?.avgPatientsPerDay ?? 0}</span>
            <span className="text-[10px] text-purple-600 font-semibold block mt-1">Across Departments</span>
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
                    placeholder="Search department name or HOD..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Department Name</th>
                      <th className="py-2.5 px-2">Department Head</th>
                      <th className="py-2.5 px-2 text-center">Doctors</th>
                      <th className="py-2.5 px-2 text-center">Emergency 24/7</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {loading && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Loading hospital departments...
                        </td>
                      </tr>
                    )}
                    {!loading && filteredDepts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No clinical departments configured.
                        </td>
                      </tr>
                    )}
                    {filteredDepts.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-2 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                            {getDeptIcon(d.icon)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{d.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{d.subtitle}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-800 block">{d.head}</span>
                          <span className="text-[10px] text-slate-400">{d.headQual}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-blue-600">{d.doctors} Specialists</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.emergency_available ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {d.emergency_available ? 'Yes (24/7)' : 'No'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setSelectedDeptModal(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" title="View Details">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setEditDeptModal({ ...d })} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" title="Edit Department">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleDeleteDept(d.id, d.name)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Delete Department">
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
              <span>Showing <strong>{filteredDepts.length}</strong> of <strong>{totalDepts}</strong> departments</span>
              <span className="text-[11px] font-semibold text-slate-400">Database Live Sync Active</span>
            </div>
          </div>

          {/* Right Column: Donut + Quick Actions (4 cols / 30%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. Departments Type Distribution Donut Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col items-center">
              <h3 className="w-full text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Department Types
              </h3>

              <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  {totalDepts > 0 && (
                    <>
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        strokeDasharray={`${(clinicalDepts / totalDepts) * circumference} ${circumference}`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#f43f5e"
                        strokeWidth="4"
                        strokeDasharray={`${(emergencyDepts / totalDepts) * circumference} ${circumference}`}
                        strokeDashoffset={-((clinicalDepts / totalDepts) * circumference)}
                      />
                    </>
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-tight">{totalDepts}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Departments</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 mt-4 text-xs font-semibold">
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Clinical Specialties</span>
                  <span className="font-bold">{clinicalDepts} ({totalDepts > 0 ? Math.round((clinicalDepts / totalDepts) * 100) : 0}%)</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Emergency / Critical Care</span>
                  <span className="font-bold">{emergencyDepts} ({totalDepts > 0 ? Math.round((emergencyDepts / totalDepts) * 100) : 0}%)</span>
                </div>
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
                  onClick={() => setAddDeptModalOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-slate-700 hover:text-blue-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-blue-600" /> Add New Department</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hospital/doctors')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Assign Doctors to Departments</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hospital/treatments')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-emerald-600" /> View Department Treatments</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Add New Department Modal */}
      {addDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Add Clinical Department</h3>
                <p className="text-[11px] text-slate-400">Configure new department in hospital database</p>
              </div>
              <button type="button" onClick={() => setAddDeptModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDept} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Specialty Template / Quick Select</label>
                <select
                  onChange={e => {
                    if (e.target.value !== '__custom__') {
                      setNewDeptForm({ ...newDeptForm, name: e.target.value, description: `Comprehensive ${e.target.value} and Clinical Care` });
                    }
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:border-blue-500 focus:bg-white outline-hidden"
                >
                  <option value="__custom__">✨ Custom (Add your own)</option>
                  <option value="Cardiology & Vascular Sciences">Cardiology & Vascular Sciences</option>
                  <option value="Orthopedics & Joint Reconstruction">Orthopedics & Joint Reconstruction</option>
                  <option value="Neurology & Neurosurgery">Neurology & Neurosurgery</option>
                  <option value="Oncology & Hematology">Oncology & Hematology</option>
                  <option value="Gastroenterology & Hepatology">Gastroenterology & Hepatology</option>
                  <option value="Nephrology & Renal Transplant">Nephrology & Renal Transplant</option>
                  <option value="Pediatrics & Neonatology">Pediatrics & Neonatology</option>
                  <option value="Pulmonology & Sleep Medicine">Pulmonology & Sleep Medicine</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nephrology & Renal Care"
                  value={newDeptForm.name}
                  onChange={e => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Focus Area</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Dialysis and Kidney Care"
                  value={newDeptForm.description}
                  onChange={e => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="py-2 border-y border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDeptForm.emergency_available}
                    onChange={e => setNewDeptForm({ ...newDeptForm, emergency_available: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                  />
                  <span>24/7 Emergency & Critical Care Enabled</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDeptModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Department</h3>
                <p className="text-[11px] text-slate-400">Update department attributes in database</p>
              </div>
              <button type="button" onClick={() => setEditDeptModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditDeptSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Department Name</label>
                <input
                  type="text"
                  required
                  value={editDeptModal.name}
                  onChange={e => setEditDeptModal({ ...editDeptModal, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <input
                  type="text"
                  value={editDeptModal.subtitle || editDeptModal.description || ''}
                  onChange={e => setEditDeptModal({ ...editDeptModal, subtitle: e.target.value, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-2 py-2 border-y border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editDeptModal.emergency_available)}
                    onChange={e => setEditDeptModal({ ...editDeptModal, emergency_available: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 cursor-pointer"
                  />
                  <span>Emergency 24/7 Enabled</span>
                </label>
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDeptModal.is_active !== false}
                    onChange={e => setEditDeptModal({ ...editDeptModal, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                  <span>Active Department Status</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditDeptModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Department Modal */}
      {selectedDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">{selectedDeptModal.name}</h3>
              <button type="button" onClick={() => setSelectedDeptModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs py-2 border-y border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Head of Department:</span>
                <span className="font-bold text-slate-900">{selectedDeptModal.head}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Qualifications:</span>
                <span className="font-semibold text-slate-700">{selectedDeptModal.headQual}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Specialists:</span>
                <span className="font-extrabold text-blue-600">{selectedDeptModal.doctors} Doctors</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Unit:</span>
                <span className={`font-bold ${selectedDeptModal.emergency_available ? 'text-rose-600' : 'text-slate-600'}`}>
                  {selectedDeptModal.emergency_available ? '24/7 Available' : 'Standard Hours'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600">{selectedDeptModal.status}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = selectedDeptModal;
                  setSelectedDeptModal(null);
                  setEditDeptModal({ ...d });
                }}
                className="w-1/2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setSelectedDeptModal(null)}
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
