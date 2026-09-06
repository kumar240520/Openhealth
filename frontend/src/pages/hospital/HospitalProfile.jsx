import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  Camera, 
  Eye, 
  Edit3, 
  Clock, 
  AlertCircle,
  PhoneCall,
  HeartPulse,
  Scissors,
  Scan,
  Pill,
  Ambulance,
  CreditCard,
  Car,
  Check,
  ChevronRight,
  ArrowRight,
  X,
  RotateCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import HospitalKycBanner from '../../components/hospital/HospitalKycBanner';
import HospitalOnboardingModal from '../../components/hospital/HospitalOnboardingModal';

export default function HospitalProfile() {
  const navigate = useNavigate();
  const { activeHospital, activeHospitalId, refreshHospital } = useHospital();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'facilities' | 'departments' | 'emergency' | 'verification'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getProfile(activeHospitalId);
      setProfile(res);
      setFormData({
        name: res.name || '',
        type: res.type || 'Multi Super Speciality Hospital',
        phone: res.phone || '',
        website: res.website || '',
        address: res.address || '',
        city: res.city || 'Indore',
        state: res.state || 'Madhya Pradesh',
        country: res.country || 'India',
        postal_code: res.postalCode || res.postal_code || '452010',
        description: res.description || '',
        emergency_available: res.emergencyAvailable !== false && res.emergency_available !== false,
        image_url: res.imageUrl || res.image_url || '',
        opening_hours: res.openingHours || res.opening_hours || 'Open 24 Hours',
        specialties: Array.isArray(res.specialties) ? res.specialties.join(', ') : (res.specialties || '')
      });
    } catch (e) {
      console.warn('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeHospitalId]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setSaveError(null);

      // Clean specialties into array of unique names
      const specialtiesArr = typeof formData.specialties === 'string'
        ? formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(formData.specialties) ? formData.specialties : []);

      const payload = {
        ...formData,
        specialties: specialtiesArr,
        emergency_available: Boolean(formData.emergency_available)
      };

      await hospitalPortalService.updateProfile(activeHospitalId, payload);
      if (refreshHospital) refreshHospital();

      setToastMsg('Hospital profile updated successfully! All changes are live on the Patient Discovery Marketplace.');
      setTimeout(() => setToastMsg(null), 4500);
      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error updating hospital profile:', err);
      setSaveError(err.message || 'Failed to update profile. Please verify your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HospitalLayout>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Success Feedback Notification Banner */}
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

        {/* =================================================================== */}
        {/* 1. BREADCRUMB & HEADER */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mb-1">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/hospital/dashboard')}>Dashboard</span>
              <span>›</span>
              <span className="text-slate-700">Hospital Profile</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hospital Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage your hospital information and settings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/hospitals/${activeHospitalId}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Public Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* KYC Compliance Banner (Vanishes when verified) */}
        <HospitalKycBanner onOpenKyc={() => setKycModalOpen(true)} />

        {/* =================================================================== */}
        {/* 2. HERO CARD WITH COMPLETENESS GAUGE (Page 2 in PDF) */}
        {/* =================================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Left: Photo & Bio Info */}
          <div className="lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Hospital Photo */}
            <div className="relative group shrink-0">
              <img 
                src={profile?.imageUrl || profile?.image_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'} 
                alt={profile?.name} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Change Photo</span>
              </button>
            </div>

            {/* Title & Metadata Grid */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 truncate">
                  {profile?.name || 'Hospital Profile'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {profile?.type || 'Multi Super Speciality Hospital'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>ID: <strong className="text-slate-800">{activeHospitalId ? `HSP-${activeHospitalId.slice(0, 8).toUpperCase()}` : 'HSP-001'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Phone: <strong className="text-slate-800">{profile?.phone || '+91 9876543210'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Email: <strong className="text-slate-800">{profile?.email || 'admin@hospital.org'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.address || 'Hospital Address, City'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Circular Profile Completeness Gauge */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            {/* Radial gauge circle */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${profile?.completeness || 86}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 leading-none">{profile?.completeness || 86}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Complete</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="flex-1 w-full flex flex-col gap-1 text-[11px] font-semibold">
              <div className="flex justify-between items-center text-slate-700">
                <span>Basic Information</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Contact Information</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Facilities</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Departments</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Emergency Services</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Verification</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* 3. SUB-NAVIGATION TABS (Page 2 in PDF) */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold text-slate-500">
          {[
            { id: 'basic', label: 'Basic Information' },
            { id: 'facilities', label: 'Facilities' },
            { id: 'departments', label: 'Departments' },
            { id: 'emergency', label: 'Emergency Services' },
            { id: 'verification', label: 'Verification Information' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =================================================================== */}
        {/* 4. MAIN CONTENT GRID (Page 2 in PDF) */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (65%) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Basic Information</h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mt-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Name</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{profile?.name || activeHospital?.name || 'Hospital Facility'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Tagline</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.tagline}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Type</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Ownership Type</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.ownershipType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Year Established</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.yearEstablished}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Number of Beds</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.totalBeds} (ICU: {profile?.icuBeds})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Emergency Available</span>
                  <span className="font-extrabold text-emerald-600 mt-0.5 block">Yes (24/7 Casualty Active)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">City / State</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.city}, {profile?.state}</span>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Description</span>
                  <p className="text-slate-600 font-medium mt-1 leading-relaxed">{profile?.description}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Contact Information</h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Number</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{profile?.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Alternate Phone</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.alternatePhone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{profile?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Website</span>
                  <span className="font-semibold text-blue-600 mt-0.5 block">{profile?.website}</span>
                </div>
              </div>
            </div>

            {/* Departments & Emergency Badges (Page 2 in PDF) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">Departments</h3>
                  <button type="button" onClick={() => navigate('/hospital/departments')} className="text-xs font-bold text-blue-600 cursor-pointer">Edit</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile?.departments?.map((dept, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                      {dept}
                    </span>
                  ))}
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">+8 More</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">Emergency Services</h3>
                  <button type="button" onClick={() => setEditModalOpen(true)} className="text-xs font-bold text-blue-600 cursor-pointer">Edit</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile?.emergencyFeatures?.map((f, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (35%) */}
          <div className="flex flex-col gap-6">
            
            {/* Key Facilities Card (8-item grid matching PDF Page 2) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Key Facilities</h3>
                <button type="button" onClick={() => setEditModalOpen(true)} className="text-xs font-bold text-blue-600 cursor-pointer flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {profile?.facilities?.map((fac, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{fac.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Regulatory Accreditation & KYC</h3>
                <button 
                  type="button" 
                  onClick={() => setKycModalOpen(true)} 
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Update KYC</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 mt-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">KYC Status</span>
                  {profile?.kyc_status === 'verified' || profile?.verification_status === 'verified' || profile?.kyc_status === 'approved' ? (
                    <span className="px-2.5 py-0.5 rounded-full font-black bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                      ✓ Verified (NABH Gold)
                    </span>
                  ) : profile?.kyc_status === 'submitted' || profile?.kyc_status === 'in_review' || profile?.verification_status === 'submitted' ? (
                    <span className="px-2.5 py-0.5 rounded-full font-black bg-amber-50 text-amber-700 text-xs border border-amber-200">
                      ⏳ Under Review
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setKycModalOpen(true)}
                      className="px-2.5 py-0.5 rounded-full font-black bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs border border-rose-200 cursor-pointer"
                    >
                      ⚠️ Complete KYC
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">License Number</span>
                  <span className={`font-bold font-mono text-[11px] ${profile?.license_number ? 'text-slate-800' : 'text-amber-600'}`}>
                    {profile?.license_number || 'Not Provided'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">GST / Tax ID</span>
                  <span className={`font-bold font-mono text-[11px] ${profile?.tax_id ? 'text-slate-800' : 'text-amber-600'}`}>
                    {profile?.tax_id || 'Not Provided'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Authorized Signatory</span>
                  <span className={`font-bold ${profile?.signatory_name ? 'text-slate-800' : 'text-amber-600'}`}>
                    {profile?.signatory_name || 'Not Specified'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Accreditation Document</span>
                  {profile?.kyc_document_url ? (
                    <a
                      href={profile.kyc_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <span>View Certificate</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-rose-500 font-bold text-[11px]">Not Uploaded</span>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Comprehensive Edit Hospital Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Edit Hospital Profile</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                    Live Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Changes update the database in real-time and reflect across the Patient Discovery Marketplace.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner if save fails */}
            {saveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 overflow-y-auto pr-1 text-xs custom-scrollbar">
              
              {/* 1. Basic Information */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">1. Hospital Identity</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Hospital Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name || ''} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Apollo Hospitals"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-900 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Facility Type</label>
                    <input 
                      type="text" 
                      value={formData.type || ''} 
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g. Multi Super Speciality Hospital"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Operating Hours</label>
                  <input 
                    type="text" 
                    value={formData.opening_hours || ''} 
                    onChange={e => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="e.g. Open 24 Hours or Open • Closes 9:00 PM"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800 transition-all outline-none"
                  />
                </div>
              </div>

              {/* 2. Contact & Online Presence */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">2. Contact & Online Presence</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Contact Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.phone || ''} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91-731-2445566"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Official Website</label>
                    <input 
                      type="url" 
                      value={formData.website || ''} 
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://apollohospitals.com/indore"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Address & Location */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">3. Physical Location</span>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Street Address</label>
                  <input 
                    type="text" 
                    value={formData.address || ''} 
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Sector D, Scheme No 74C, Vijay Nagar"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">City</label>
                    <input 
                      type="text" 
                      value={formData.city || ''} 
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Indore"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-800 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">State</label>
                    <input 
                      type="text" 
                      value={formData.state || ''} 
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Madhya Pradesh"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Postal PIN Code</label>
                    <input 
                      type="text" 
                      value={formData.postal_code || ''} 
                      onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="452010"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Casualty & Emergency Live Switch */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 block">4. Emergency & Casualty Intake</span>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Live 24x7 Casualty status displayed to ambulance coordinators and emergency patients.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={Boolean(formData.emergency_available)} 
                    onChange={e => setFormData({ ...formData, emergency_available: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* 5. Clinical Specialties */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">5. Clinical Specialties</span>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Specialties (comma-separated)</label>
                <input 
                  type="text" 
                  value={formData.specialties || ''} 
                  onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Cardiology, Oncology, Organ Transplant, Neurology, Orthopedics"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800 transition-all outline-none"
                />
                
                {/* Popular Tags Quick Click */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Quick Add:</span>
                  {['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Critical Care', 'Gastroenterology', 'Nephrology'].map((spec) => {
                    const currentSpecs = (formData.specialties || '').split(',').map(s => s.trim().toLowerCase());
                    const isAdded = currentSpecs.includes(spec.toLowerCase());
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => {
                          const list = (formData.specialties || '').split(',').map(s => s.trim()).filter(Boolean);
                          if (isAdded) {
                            setFormData({ ...formData, specialties: list.filter(s => s.toLowerCase() !== spec.toLowerCase()).join(', ') });
                          } else {
                            setFormData({ ...formData, specialties: [...list, spec].join(', ') });
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                          isAdded 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {isAdded ? `✓ ${spec}` : `+ ${spec}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Hospital Photo */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">6. Facility Photo & Branding</span>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {formData.image_url ? (
                    <img 
                      src={formData.image_url} 
                      alt="Hospital Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Image URL (Web link / Unsplash)</label>
                    <input 
                      type="url" 
                      value={formData.image_url || ''} 
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Description */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">7. Hospital Overview & Bio</span>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">About the Hospital</label>
                <textarea 
                  rows={3}
                  value={formData.description || ''} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a comprehensive summary of clinical capabilities, accreditations, and medical services..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800 transition-all outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Saving to Database...' : 'Save & Sync Live'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* KYC / Onboarding Modal */}
      <HospitalOnboardingModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        isKycOnly={true}
        onCompleted={() => {
          loadData();
          refreshHospital();
        }}
      />
    </HospitalLayout>
  );
}
