import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  Plus, 
  Download, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  X,
  UserCheck,
  Calendar,
  Phone,
  Building2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_DOCTOR_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1594824813588-46639b9409ef?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&w=600&q=80'
];

const getRandomDoctorAvatar = (seed = '') => {
  const hash = seed ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * DEFAULT_DOCTOR_AVATARS.length);
  return DEFAULT_DOCTOR_AVATARS[Math.abs(hash) % DEFAULT_DOCTOR_AVATARS.length];
};

export default function HospitalDoctors() {
  const navigate = useNavigate();
  const { activeHospitalId } = useHospital();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedDoctorModal, setSelectedDoctorModal] = useState(null);
  const [editDoctorModal, setEditDoctorModal] = useState(null);
  const [addDoctorModalOpen, setAddDoctorModalOpen] = useState(false);
  
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    department_id: '',
    custom_department: '',
    specialization: '',
    qualification: 'MBBS, MD',
    registration_number: '',
    experience_years: 5,
    consultation_fee: 800,
    opd_timings: '10:00 AM - 02:00 PM',
    image_url: '',
    about: '',
    is_active: true
  });

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getDoctors(activeHospitalId);
      setData(res);
    } catch (e) {
      console.warn('Failed to load doctors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileSelect = (file, callback) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadDoctors();

    if (!activeHospitalId) return;

    // Supabase Realtime CDC subscription for live sync
    const channel = supabase
      .channel(`hospital-doctors-${activeHospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `hospital_id=eq.${activeHospitalId}`
        },
        () => {
          loadDoctors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  const filteredDoctors = (data?.doctors || []).filter(doc => {
    if (deptFilter !== 'all' && doc.department !== deptFilter && doc.department_id !== deptFilter) return false;
    if (statusFilter !== 'all' && doc.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) || 
        doc.specialization.toLowerCase().includes(q) || 
        doc.department.toLowerCase().includes(q) ||
        (doc.code && doc.code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctorForm.name) return;
    try {
      let deptId = newDoctorForm.department_id;
      let deptName = '';

      if (deptId === '__custom__' && newDoctorForm.custom_department?.trim()) {
        const customName = newDoctorForm.custom_department.trim();
        // Insert custom department
        const { data: newDept, error: dErr } = await supabase
          .from('departments')
          .insert({
            hospital_id: activeHospitalId,
            name: customName,
            description: `${customName} Department`,
            emergency_available: false,
            is_active: true
          })
          .select()
          .single();
        if (dErr) throw dErr;
        deptId = newDept.id;
        deptName = newDept.name;
      } else {
        const depts = data?.departmentsCatalog || [];
        deptId = deptId || (depts[0] ? depts[0].id : null);
        const matchedDept = depts.find(d => d.id === deptId);
        deptName = matchedDept ? matchedDept.name : 'General Specialist';
      }
      
      const docPayload = {
        hospital_id: activeHospitalId,
        department_id: deptId,
        name: newDoctorForm.name.startsWith('Dr.') ? newDoctorForm.name : `Dr. ${newDoctorForm.name}`,
        specialization: newDoctorForm.specialization || `${deptName} Specialist`,
        qualification: newDoctorForm.qualification || 'MBBS, MD',
        registration_number: newDoctorForm.registration_number?.trim() || `REG-${Date.now().toString().slice(-6)}`,
        experience_years: Number(newDoctorForm.experience_years) || 5,
        consultation_fee: Number(newDoctorForm.consultation_fee) || 500,
        opd_timings: newDoctorForm.opd_timings || '10:00 AM - 02:00 PM',
        available_today: true,
        is_active: newDoctorForm.is_active !== false,
        image_url: newDoctorForm.image_url?.trim() || getRandomDoctorAvatar(newDoctorForm.name),
        about: newDoctorForm.about?.trim() || ''
      };
      await hospitalPortalService.addDoctor(docPayload);
      await loadDoctors();
      setAddDoctorModalOpen(false);
      setNewDoctorForm({
        name: '',
        department_id: '',
        custom_department: '',
        specialization: '',
        qualification: 'MBBS, MD',
        registration_number: '',
        experience_years: 5,
        consultation_fee: 800,
        opd_timings: '10:00 AM - 02:00 PM',
        image_url: '',
        about: '',
        is_active: true
      });
    } catch (err) {
      console.error('Failed to add doctor:', err);
      alert('Error adding doctor: ' + (err.message || 'Check database connection'));
    }
  };

  const handleEditDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!editDoctorModal) return;
    try {
      let deptId = editDoctorModal.department_id;
      if (deptId === '__custom__' && editDoctorModal.custom_department?.trim()) {
        const customName = editDoctorModal.custom_department.trim();
        const { data: newDept, error: dErr } = await supabase
          .from('departments')
          .insert({
            hospital_id: activeHospitalId,
            name: customName,
            description: `${customName} Department`,
            emergency_available: false,
            is_active: true
          })
          .select()
          .single();
        if (dErr) throw dErr;
        deptId = newDept.id;
      }

      await hospitalPortalService.updateDoctor(editDoctorModal.id, {
        name: editDoctorModal.name,
        department_id: deptId,
        specialization: editDoctorModal.specialization,
        qualification: editDoctorModal.qualification,
        registration_number: editDoctorModal.registration_number || editDoctorModal.code,
        experience_years: Number(editDoctorModal.experience_years) || 5,
        consultation_fee: Number(editDoctorModal.consultation_fee !== undefined ? editDoctorModal.consultation_fee : editDoctorModal.fee) || 500,
        opd_timings: editDoctorModal.shift || editDoctorModal.opd_timings || '10:00 AM - 02:00 PM',
        image_url: editDoctorModal.image_url?.trim() || editDoctorModal.photo || editDoctorModal.image || getRandomDoctorAvatar(editDoctorModal.name),
        about: editDoctorModal.about || '',
        available_today: Boolean(editDoctorModal.available_today),
        is_active: editDoctorModal.is_active !== false
      });
      setEditDoctorModal(null);
      await loadDoctors();
    } catch (err) {
      console.error('Failed to update doctor:', err);
      alert('Error updating doctor: ' + (err.message || 'Check database connection'));
    }
  };

  const handleToggleDuty = async (doctorId) => {
    try {
      await hospitalPortalService.toggleDoctorDuty(doctorId);
      await loadDoctors();
    } catch (err) {
      console.error('Failed to toggle duty:', err);
    }
  };

  const handleToggleActive = async (doctorId, currentStatus) => {
    const nextActive = !(currentStatus !== false);
    try {
      setData(prev => {
        if (!prev?.doctors) return prev;
        const updated = prev.doctors.map(d => d.id === doctorId ? { ...d, is_active: nextActive, status: nextActive ? 'Active' : 'Inactive' } : d);
        const inactiveCount = updated.filter(d => d.is_active === false).length;
        return {
          ...prev,
          doctors: updated,
          kpis: {
            ...prev.kpis,
            inactive: inactiveCount
          }
        };
      });
      await hospitalPortalService.toggleDoctorActive(doctorId, nextActive);
      await loadDoctors();
    } catch (err) {
      console.error('Failed to toggle doctor active status:', err);
      await loadDoctors();
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name || 'this doctor'} from the hospital roster?`)) {
      try {
        await hospitalPortalService.deleteDoctor(id);
        await loadDoctors();
      } catch (err) {
        console.error('Failed to delete doctor:', err);
      }
    }
  };

  // Compute SVG Donut segments for real departments breakdown
  const departments = data?.departments || [];
  const totalDoctors = data?.kpis?.total || 0;
  const circumference = 2 * Math.PI * 14; // ≈ 87.96
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
              <span className="text-slate-700">Doctors</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Doctors Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Live hospital doctor roster, clinical profiles, availability, and OPD consultation fees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const csvRows = [
                  ['Name', 'Code', 'Department', 'Specialization', 'Qualification', 'Experience', 'Consultation Fee', 'Status', 'Availability'],
                  ...(data?.doctors || []).map(d => [
                    d.name, d.code, d.department, d.specialization, d.qualification, d.experience, `INR ${d.fee}`, d.status, d.availability
                  ])
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Doctors_Roster_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Roster</span>
            </button>
            <button
              type="button"
              onClick={() => setAddDoctorModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Doctor</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. TOP 5 KPI CARDS */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Doctors</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{data?.kpis?.total ?? 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Verified Roster</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Today</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{data?.kpis?.availableToday ?? 0}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">
              {totalDoctors > 0 ? Math.round(((data?.kpis?.availableToday || 0) / totalDoctors) * 100) : 0}% Available
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">On Duty Today</span>
            <span className="text-2xl font-black text-indigo-600 mt-0.5 block">{data?.kpis?.onDuty ?? 0}</span>
            <span className="text-[10px] text-indigo-600 font-bold block mt-1">Active Shifts</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">On Leave</span>
            <span className="text-2xl font-black text-amber-600 mt-0.5 block">{data?.kpis?.onLeave ?? 0}</span>
            <span className="text-[10px] text-amber-600 font-semibold block mt-1">Off Duty</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-2">
              <X className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Inactive</span>
            <span className="text-2xl font-black text-slate-600 mt-0.5 block">{data?.kpis?.inactive ?? 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Deactivated</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. MAIN SECTION: TABLE (70%) + STATS (30%) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Doctors Table (8 cols / 70%) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
                  >
                    <option value="all">All Departments</option>
                    {(data?.departmentsCatalog || []).map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
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
                    placeholder="Search doctor or specialty..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 uppercase text-[10px]">
                      <th className="py-2.5 px-2">Doctor Name</th>
                      <th className="py-2.5 px-2">Department</th>
                      <th className="py-2.5 px-2">Specialization</th>
                      <th className="py-2.5 px-2">Qualification</th>
                      <th className="py-2.5 px-2 text-center">Fee</th>
                      <th className="py-2.5 px-2 text-center">Duty Status</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {loading && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Loading verified doctors from database...
                        </td>
                      </tr>
                    )}
                    {!loading && filteredDoctors.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No doctors found matching criteria.
                        </td>
                      </tr>
                    )}
                    {filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-2 flex items-center gap-2.5">
                          <img 
                            src={doc.photo || doc.image} 
                            alt={doc.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{doc.code}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-800">{doc.department}</td>
                        <td className="py-2.5 px-2 text-slate-600">{doc.specialization}</td>
                        <td className="py-2.5 px-2 text-slate-600">{doc.qualification}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900">₹{doc.fee}</td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDuty(doc.id)}
                            title="Click to toggle Today's Duty Status"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              doc.available_today
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {doc.available_today ? '● On Duty' : '○ On Leave'}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(doc.id, doc.is_active)}
                            title="Click to toggle Active / Inactive doctor status"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              doc.is_active !== false
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {doc.is_active !== false ? '● Active' : '○ Inactive'}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              type="button" 
                              onClick={() => setSelectedDoctorModal(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" 
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditDoctorModal({ ...doc })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" 
                              title="Edit Doctor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                              title="Remove Doctor"
                            >
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

            {/* Real Stats Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <strong>{filteredDoctors.length}</strong> of <strong>{totalDoctors}</strong> verified doctors</span>
              <span className="text-[11px] font-semibold text-slate-400">Database Live Sync Active</span>
            </div>
          </div>

          {/* Right Column: Donut + Quick Stats + Quick Actions (4 cols / 30%) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. Doctors by Department Donut Card (Real Database) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col items-center">
              <h3 className="w-full text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Doctors by Department
              </h3>

              <div className="relative w-36 h-36 mt-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                  {departments.map((dept) => {
                    const strokeDash = (dept.percentage / 100) * circumference;
                    const strokeOffset = -((accumulatedPercent / 100) * circumference);
                    accumulatedPercent += dept.percentage;
                    return (
                      <circle
                        key={dept.name}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke={dept.color}
                        strokeWidth="4"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-tight">{totalDoctors}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Specialists</span>
                </div>
              </div>

              {/* Dynamic Legend */}
              <div className="w-full flex flex-col gap-2 mt-4 text-xs font-semibold">
                {departments.map((dept) => (
                  <div key={dept.name} className="flex justify-between text-slate-700">
                    <span className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                      <span className="truncate">{dept.name}</span>
                    </span>
                    <span className="font-bold shrink-0">{dept.count} ({dept.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Quick Stats Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <h3 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100">
                Quick Stats
              </h3>

              <div className="flex flex-col gap-2.5 mt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Average Experience</span>
                  <strong className="text-slate-900">{data?.quickStats?.avgExperience || '0 Years'}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Average Consultation Fee</span>
                  <strong className="text-slate-900">₹{data?.kpis?.avgFee || 0}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Senior Consultants</span>
                  <strong className="text-slate-900">{data?.quickStats?.consultantDoctors || '0'}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Verified Credentials</span>
                  <strong className="text-slate-900">{data?.quickStats?.verifiedSpecialists || '100%'}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Active Roster Status</span>
                  <strong className="text-emerald-600">{data?.quickStats?.activeRosterRate || '100%'}</strong>
                </div>
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
                  onClick={() => setAddDoctorModalOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-blue-600" /> Add New Specialist</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hospital/departments')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-indigo-600" /> Manage Clinical Departments</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================================== */}
      {/* ADD NEW DOCTOR MODAL */}
      {/* =================================================================== */}
      {addDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 pb-4 shrink-0 bg-white">
              <div>
                <h3 className="font-black text-base text-slate-900">Add Clinical Specialist</h3>
                <p className="text-[11px] text-slate-400 font-medium">Add doctor directly to the hospital's verified roster</p>
              </div>
              <button type="button" onClick={() => setAddDoctorModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto px-5 py-4 space-y-3.5 text-xs flex-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={newDoctorForm.name}
                    onChange={e => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Department *</label>
                    <select
                      value={newDoctorForm.department_id}
                      onChange={e => setNewDoctorForm({ ...newDoctorForm, department_id: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:border-blue-500 focus:bg-white outline-hidden"
                      required
                    >
                      <option value="">Select Department</option>
                      {(data?.departmentsCatalog || []).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                      <option value="__custom__">✨ Custom (Add your own)</option>
                    </select>

                    {newDoctorForm.department_id === '__custom__' && (
                      <div className="mt-2 animate-fadeIn">
                        <label className="text-[9px] font-bold text-blue-600 uppercase">Enter Custom Department Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pediatric Endocrinology"
                          value={newDoctorForm.custom_department || ''}
                          onChange={e => setNewDoctorForm({ ...newDoctorForm, custom_department: e.target.value })}
                          className="w-full mt-1 p-2 rounded-xl border border-blue-300 bg-blue-50/40 font-semibold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Qualification</label>
                    <input
                      type="text"
                      value={newDoctorForm.qualification}
                      onChange={e => setNewDoctorForm({ ...newDoctorForm, qualification: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Specialization / Clinical Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Interventional Cardiologist"
                    value={newDoctorForm.specialization}
                    onChange={e => setNewDoctorForm({ ...newDoctorForm, specialization: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      value={newDoctorForm.experience_years}
                      onChange={e => setNewDoctorForm({ ...newDoctorForm, experience_years: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">OPD Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newDoctorForm.consultation_fee}
                      onChange={e => setNewDoctorForm({ ...newDoctorForm, consultation_fee: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">OPD Timings</label>
                  <input
                    type="text"
                    placeholder="Mon - Sat: 10:00 AM - 02:00 PM"
                    value={newDoctorForm.opd_timings}
                    onChange={e => setNewDoctorForm({ ...newDoctorForm, opd_timings: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Registration / Medical License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. MCI-2018-99421"
                    value={newDoctorForm.registration_number || ''}
                    onChange={e => setNewDoctorForm({ ...newDoctorForm, registration_number: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                {/* Profile Photo Upload & Curated Fallback Selector */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                      {newDoctorForm.image_url ? (
                        <img
                          src={newDoctorForm.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_DOCTOR_AVATARS[0];
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                          <span className="text-[8px] font-bold mt-0.5">Placeholder</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileSelect(file, (dataUrl) => {
                                  setNewDoctorForm(prev => ({ ...prev, image_url: dataUrl }));
                                });
                              }
                            }}
                          />
                        </label>
                        {newDoctorForm.image_url && (
                          <button
                            type="button"
                            onClick={() => setNewDoctorForm(prev => ({ ...prev, image_url: '' }))}
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Upload from computer, select an avatar below, or leave blank to auto-assign a professional portrait.
                      </p>
                    </div>
                  </div>

                  {/* Quick Avatar Presets */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      Quick Avatars:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {DEFAULT_DOCTOR_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewDoctorForm(prev => ({ ...prev, image_url: av }))}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            newDoctorForm.image_url === av ? 'border-blue-600 scale-105 shadow-xs' : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                          title={`Select Avatar ${idx + 1}`}
                        >
                          <img src={av} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Doctor Biography / Clinical Summary</label>
                  <textarea
                    rows="2"
                    placeholder="Specialist background, clinical sub-specialties, fellowship details..."
                    value={newDoctorForm.about || ''}
                    onChange={e => setNewDoctorForm({ ...newDoctorForm, about: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden resize-none"
                  />
                </div>

                {/* Active Toggle Option */}
                <div className="flex items-center gap-3 py-2 border-y border-slate-100 bg-slate-50/50 px-3 rounded-xl">
                  <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDoctorForm.is_active !== false}
                      onChange={e => setNewDoctorForm({ ...newDoctorForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <span>Active Doctor (Visible in Directory & Available for Appointments)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setAddDoctorModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs transition-colors"
                >
                  Add Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EDIT DOCTOR MODAL */}
      {/* =================================================================== */}
      {editDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 pb-4 shrink-0 bg-white">
              <div>
                <h3 className="font-black text-base text-slate-900">Edit Doctor Profile</h3>
                <p className="text-[11px] text-slate-400 font-medium">Update credentials, OPD fee, roster status, and schedule</p>
              </div>
              <button type="button" onClick={() => setEditDoctorModal(null)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditDoctorSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto px-5 py-4 space-y-3.5 text-xs flex-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={editDoctorModal.name}
                    onChange={e => setEditDoctorModal({ ...editDoctorModal, name: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                    <select
                      value={editDoctorModal.department_id || ''}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, department_id: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:border-blue-500 focus:bg-white outline-hidden"
                    >
                      {(data?.departmentsCatalog || []).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                      <option value="__custom__">✨ Custom (Add your own)</option>
                    </select>

                    {editDoctorModal.department_id === '__custom__' && (
                      <div className="mt-2 animate-fadeIn">
                        <label className="text-[9px] font-bold text-blue-600 uppercase">Enter Custom Department Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pediatric Oncology"
                          value={editDoctorModal.custom_department || ''}
                          onChange={e => setEditDoctorModal({ ...editDoctorModal, custom_department: e.target.value })}
                          className="w-full mt-1 p-2 rounded-xl border border-blue-300 bg-blue-50/40 font-semibold text-slate-900 text-xs focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Qualification</label>
                    <input
                      type="text"
                      value={editDoctorModal.qualification || ''}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, qualification: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Specialization</label>
                  <input
                    type="text"
                    value={editDoctorModal.specialization || ''}
                    onChange={e => setEditDoctorModal({ ...editDoctorModal, specialization: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Experience (Years)</label>
                    <input
                      type="number"
                      value={editDoctorModal.experience_years || 5}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, experience_years: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">OPD Fee (₹)</label>
                    <input
                      type="number"
                      value={editDoctorModal.fee || editDoctorModal.consultation_fee || 500}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, consultation_fee: e.target.value, fee: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Registration / License No.</label>
                    <input
                      type="text"
                      placeholder="e.g. MCI-2018-99421"
                      value={editDoctorModal.registration_number || editDoctorModal.code || ''}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, registration_number: e.target.value, code: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">OPD Timings</label>
                    <input
                      type="text"
                      placeholder="10:00 AM - 02:00 PM"
                      value={editDoctorModal.shift || editDoctorModal.opd_timings || ''}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, shift: e.target.value, opd_timings: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload & Curated Fallback Selector */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                      {(editDoctorModal.image_url || editDoctorModal.photo || editDoctorModal.image) ? (
                        <img
                          src={editDoctorModal.image_url || editDoctorModal.photo || editDoctorModal.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_DOCTOR_AVATARS[0];
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                          <span className="text-[8px] font-bold mt-0.5">Placeholder</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Upload New Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileSelect(file, (dataUrl) => {
                                  setEditDoctorModal(prev => ({ ...prev, image_url: dataUrl, photo: dataUrl, image: dataUrl }));
                                });
                              }
                            }}
                          />
                        </label>
                        {(editDoctorModal.image_url || editDoctorModal.photo || editDoctorModal.image) && (
                          <button
                            type="button"
                            onClick={() => setEditDoctorModal(prev => ({ ...prev, image_url: '', photo: '', image: '' }))}
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Upload from computer, select an avatar below, or leave blank to auto-assign a professional portrait.
                      </p>
                    </div>
                  </div>

                  {/* Quick Avatar Presets */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                      Quick Avatars:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {DEFAULT_DOCTOR_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditDoctorModal(prev => ({ ...prev, image_url: av, photo: av, image: av }))}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                            (editDoctorModal.image_url === av || editDoctorModal.photo === av) ? 'border-blue-600 scale-105 shadow-xs' : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                          title={`Select Avatar ${idx + 1}`}
                        >
                          <img src={av} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Doctor Biography / Clinical Summary</label>
                  <textarea
                    rows="2"
                    placeholder="Specialist background, clinical sub-specialties, fellowship details..."
                    value={editDoctorModal.about || ''}
                    onChange={e => setEditDoctorModal({ ...editDoctorModal, about: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white outline-hidden resize-none"
                  />
                </div>

                {/* Status Toggles: Active on Roster & Available Today */}
                <div className="flex flex-wrap items-center gap-6 py-2.5 border-y border-slate-100 bg-slate-50/50 px-3 rounded-xl">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDoctorModal.is_active !== false}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <span>Active on Hospital Roster</span>
                  </label>

                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDoctorModal.available_today !== false}
                      onChange={e => setEditDoctorModal({ ...editDoctorModal, available_today: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <span>Available Today (On Duty)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditDoctorModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DOCTOR QUICK VIEW MODAL */}
      {/* =================================================================== */}
      {selectedDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Doctor Credentials</h3>
              <button type="button" onClick={() => setSelectedDoctorModal(null)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img 
                src={selectedDoctorModal.photo || selectedDoctorModal.image} 
                alt={selectedDoctorModal.name} 
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <h4 className="font-black text-slate-900 text-sm">{selectedDoctorModal.name}</h4>
                <p className="text-xs text-blue-600 font-bold">{selectedDoctorModal.specialization}</p>
                <p className="text-[11px] text-slate-400">{selectedDoctorModal.qualification} • {selectedDoctorModal.experience}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs py-3 border-y border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-bold text-slate-800">{selectedDoctorModal.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration Code:</span>
                <span className="font-mono font-bold text-slate-800">{selectedDoctorModal.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consultation Fee:</span>
                <span className="font-bold text-slate-900">₹{selectedDoctorModal.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OPD Timings:</span>
                <span className="font-bold text-slate-800">{selectedDoctorModal.shift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duty Status:</span>
                <span className={`font-bold ${selectedDoctorModal.available_today ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedDoctorModal.available_today ? 'On Duty' : 'On Leave'}
                </span>
              </div>
              {selectedDoctorModal.about && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">About Specialist:</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{selectedDoctorModal.about}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const doc = selectedDoctorModal;
                  setSelectedDoctorModal(null);
                  setEditDoctorModal({ ...doc });
                }}
                className="w-1/2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
              >
                Edit Doctor
              </button>
              <button
                type="button"
                onClick={() => setSelectedDoctorModal(null)}
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
