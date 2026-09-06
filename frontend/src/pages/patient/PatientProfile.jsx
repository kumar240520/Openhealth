import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Lock, 
  Calendar, 
  MapPin, 
  Activity, 
  Heart, 
  Copy, 
  Check, 
  AlertCircle, 
  Save, 
  Loader2, 
  CreditCard,
  Building2,
  FileText,
  ArrowRight,
  X,
  Upload,
  Camera,
  ChevronDown,
  IdCard,
  Hash,
  HelpCircle,
  Send,
  Info,
  QrCode,
  Download,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedAbha, setCopiedAbha] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [profileQrModalOpen, setProfileQrModalOpen] = useState(false);
  const [profileQrDataUrl, setProfileQrDataUrl] = useState('');
  const [patientUid, setPatientUid] = useState('');
  const [scannedEhrData, setScannedEhrData] = useState(null);
  const [loadingScanPreview, setLoadingScanPreview] = useState(false);

  // Profile data from backend
  const [profile, setProfile] = useState(null);
  const patientDetails = profile?.patient_details || {};

  // ===================================================================
  // KYC MODAL STATE (Matching Onboarding Step 2 specification)
  // ===================================================================
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycDetails, setKycDetails] = useState({
    photoPreview: '',
    photoFile: null,
    aadhaarNumber: '',
    govtMedicalIdType: '',
    govtMedicalIdNumber: '',
    insuranceDocFile: null,
    insuranceDocFileName: ''
  });

  // Appeal Modal State
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealForm, setAppealForm] = useState({
    credential_field: 'full_name',
    requested_value: '',
    justification: ''
  });

  // Editable Profile Form State
  const [formData, setFormData] = useState({
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    city: '',
    state: '',
    postal_code: '',
    preferred_language: 'en',
    height_cm: '',
    weight_kg: '',
    family_members_count: 1
  });

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch full patient profile from backend
  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await patientService.getProfile();
      setProfile(data);

      const pDetails = data?.patient_details || {};
      setFormData({
        blood_group: pDetails.blood_group || '',
        emergency_contact_name: pDetails.emergency_contact_name || '',
        emergency_contact_phone: pDetails.emergency_contact_phone || '',
        city: pDetails.city || 'Indore',
        state: pDetails.state || 'Madhya Pradesh',
        postal_code: pDetails.postal_code || '452001',
        preferred_language: pDetails.preferred_language || 'en',
        height_cm: pDetails.height_cm || '',
        weight_kg: pDetails.weight_kg || '',
        family_members_count: pDetails.family_members_count || 1
      });

      // Pre-populate KYC details from DB if available
      setKycDetails(prev => ({
        ...prev,
        photoPreview: data?.avatar_url || '',
        aadhaarNumber: pDetails.aadhaar_number || '',
        govtMedicalIdType: pDetails.govt_id_type || '',
        govtMedicalIdNumber: pDetails.govt_id_number || '',
        insuranceDocFileName: pDetails.insurance_policy_url || ''
      }));
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast(err.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Handle Copy ABHA ID
  const handleCopyAbha = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedAbha(true);
    setTimeout(() => setCopiedAbha(false), 2000);
  };

  // Generate patient UID QR code for profile card and modal
  useEffect(() => {
    const uid = patientDetails?.id || profile?.id || user?.id || '';
    if (uid) {
      setPatientUid(uid);
      QRCode.toDataURL(uid, {
        width: 320,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then(url => setProfileQrDataUrl(url))
        .catch(err => console.warn('Profile QR code generation error:', err));
    }
  }, [patientDetails, profile, user]);

  // Fetch scanned clinical telemetry using the UID scan engine
  const handleFetchScannedData = async () => {
    const uid = patientUid || patientDetails?.id || profile?.id || user?.id;
    if (!uid) return;
    try {
      setLoadingScanPreview(true);
      const res = await fetch(`http://localhost:5000/api/v1/patient/scan/${uid}`);
      const json = await res.json();
      if (json.success) {
        setScannedEhrData(json.data);
      } else {
        showToast(json.error?.message || 'Failed to scan patient UID', 'error');
      }
    } catch (e) {
      console.warn('Scan preview error:', e);
      showToast('Could not connect to scan engine: ' + e.message, 'error');
    } finally {
      setLoadingScanPreview(false);
    }
  };

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    const h = parseFloat(formData.height_cm) / 100;
    const w = parseFloat(formData.weight_kg);
    if (!h || !w || h <= 0 || w <= 0) return null;

    const bmi = (w / (h * h)).toFixed(1);
    let category = 'Normal';
    let colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';

    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
    } else if (bmi >= 30) {
      category = 'Obese';
      colorClass = 'text-rose-600 bg-rose-50 border-rose-200';
    }

    return { value: bmi, category, colorClass };
  }, [formData.height_cm, formData.weight_kg]);

  // Handle Profile Update Submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await patientService.updateProfile(formData);
      setProfile(updated);
      showToast('Patient profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Aadhaar input formatter (from Onboarding Step 2)
  const handleAadhaarChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = rawVal.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setKycDetails(prev => ({ ...prev, aadhaarNumber: formatted }));
  };

  // Patient Photo Upload handler (from Onboarding Step 2)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setKycDetails(prev => ({
        ...prev,
        photoFile: file,
        photoPreview: previewUrl
      }));
    }
  };

  // Direct Avatar Photo Upload to Database
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile photo must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      try {
        showToast('Saving profile photo to database...');
        await patientService.updateProfile({ avatar_url: dataUrl });
        setProfile(prev => ({ ...prev, avatar_url: dataUrl }));
        showToast('Profile photo updated successfully!');
      } catch (err) {
        console.error('Avatar upload error:', err);
        alert('Failed to update photo: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  // Government ID helper info (exact replica from Onboarding Step 2)
  const getGovtIdInfo = () => {
    switch (kycDetails.govtMedicalIdType) {
      case 'pmjay':
        return {
          label: 'Ayushman Bharat (PM-JAY) Card / ID Number',
          placeholder: 'e.g. PMJAY-1234-5678-9012 or 9-digit AB-PMJAY ID',
          hint: 'Found on your Ayushman Card or PM-JAY enrollment letter.'
        };
      case 'abha':
        return {
          label: 'ABHA Health ID Number / Address',
          placeholder: 'e.g. 91-1234-5678-9012 or username@abdm',
          hint: '14-digit Ayushman Bharat Health Account number or ABHA address.'
        };
      case 'cghs':
        return {
          label: 'CGHS Beneficiary Card Number',
          placeholder: 'e.g. CGHS-BEN-9876543',
          hint: 'Printed on your Central Government Health Scheme plastic card.'
        };
      case 'esic':
        return {
          label: 'ESIC Insurance Number (IP Number)',
          placeholder: 'e.g. 17-digit ESIC Pehchan Card Number',
          hint: 'Your 17-digit employee state insurance identification code.'
        };
      case 'state_bpl':
        return {
          label: 'State BPL / Ration Health Card Number',
          placeholder: 'e.g. State Food & Health Scheme ID',
          hint: 'BPL Ration Card or State specific health scheme identifier.'
        };
      default:
        return {
          label: 'Government Medical ID Number',
          placeholder: 'Enter your scheme ID number',
          hint: 'Official identification number printed on your medical card.'
        };
    }
  };

  // Scheme Type Label Resolver
  const getSchemeDisplayLabel = (type) => {
    switch (type) {
      case 'pmjay': return 'Ayushman Bharat (PM-JAY)';
      case 'abha': return 'ABHA Health ID / Account';
      case 'cghs': return 'Central Government Health Scheme (CGHS)';
      case 'esic': return 'Employees State Insurance (ESIC)';
      case 'state_bpl': return 'State BPL / Ration Health Scheme';
      case 'none': return 'Private Cashless Care';
      default: return type ? type.toUpperCase() : 'Not Linked';
    }
  };

  // Submit KYC Documents (Step 2 Complete Input Pipeline)
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    const cleanAadhaar = kycDetails.aadhaarNumber.replace(/\D/g, '');
    
    if (cleanAadhaar.length > 0 && cleanAadhaar.length !== 12) {
      alert('Aadhaar number must contain exactly 12 digits.');
      return;
    }

    if (!cleanAadhaar && !kycDetails.govtMedicalIdNumber.trim()) {
      alert('Please provide either your 12-digit Aadhaar number or Government Medical Scheme ID.');
      return;
    }

    try {
      setKycSubmitting(true);
      await patientService.submitKYC({
        photo_url: kycDetails.photoPreview || null,
        aadhaar_number: cleanAadhaar || null,
        govt_id_type: kycDetails.govtMedicalIdType || 'aadhaar',
        govt_id_number: kycDetails.govtMedicalIdNumber.trim() || cleanAadhaar,
        insurance_policy_url: kycDetails.insuranceDocFileName || null
      });

      showToast('KYC documents submitted & verified successfully!');
      setKycModalOpen(false);
      await fetchProfile();
    } catch (err) {
      console.error('KYC submission error:', err);
      alert('Failed to verify KYC: ' + err.message);
    } finally {
      setKycSubmitting(false);
    }
  };

  // Handle Appeal Submission
  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealForm.requested_value.trim() || !appealForm.justification.trim()) {
      alert('Please provide the corrected value and reason.');
      return;
    }

    try {
      setAppealSubmitting(true);
      const res = await patientService.submitAppeal(appealForm);
      showToast(res.message || 'Appeal submitted to compliance helpdesk.');
      setAppealModalOpen(false);
      setAppealForm({ credential_field: 'full_name', requested_value: '', justification: '' });
    } catch (err) {
      alert('Failed to submit appeal: ' + err.message);
    } finally {
      setAppealSubmitting(false);
    }
  };

  // REAL DATABASE STATE (NO MOCK DATA)
  const aadhaarNumber = patientDetails.aadhaar_number || null;
  const isKycVerified = patientDetails.kyc_status === 'verified' && Boolean(aadhaarNumber || patientDetails.govt_id_number);
  const abhaNumber = patientDetails.abha_id || null;
  const govtSchemeType = patientDetails.govt_id_type || null;
  const govtSchemeNumber = patientDetails.govt_id_number || null;
  const insuranceDoc = patientDetails.insurance_policy_url || null;

  return (
    <AppLayout>
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-6 select-none min-w-0">

        {/* Toast Notification */}
        {toastMsg && (
          <div className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-fade-in ${
            toastMsg.type === 'error' ? 'bg-rose-900 text-white' : 'bg-slate-900 text-white'
          }`}>
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* 1. HEADER                                                           */}
        {/* =================================================================== */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-700 font-extrabold">Profile</span>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
            Patient Profile & Health Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
            Manage your verified credentials, ABHA digital pass, clinical vitals, and emergency contacts
          </p>
        </div>

        {/* =================================================================== */}
        {/* 2. FULL HORIZONTAL BOX: COMPLETE YOUR KYC (Shown if KYC incomplete) */}
        {/* =================================================================== */}
        {!isKycVerified && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border-2 border-amber-400/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5">
                <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Complete Your KYC Documentation
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300">
                    Action Required
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 max-w-3xl leading-relaxed">
                  Your identity documents and National Aadhaar / Medical ID have not been verified yet. Complete your KYC documentation now to activate your official Digital Health Pass, enable instant cashless hospital admissions, and secure government health scheme eligibility.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setKycModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              <span>Complete Your KYC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Loading your clinical health profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">

            {/* =============================================================== */}
            {/* 3. PATIENT IDENTITY & ABHA HEALTH PASS (Clean White UI Theme)   */}
            {/* =============================================================== */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 text-slate-900 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Left: Avatar + Upload Photo Action + Name + ABHA ID */}
              <div className="flex items-center gap-4 sm:gap-5">
                
                {/* Avatar with live photo from database + Upload Trigger */}
                <div className="relative group/avatar shrink-0">
                  <img 
                    src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                    alt={profile?.full_name || 'Patient'} 
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                  />
                  
                  {/* Status badge */}
                  <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow ${isKycVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {isKycVerified ? <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" /> : <ShieldAlert className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Upload photo overlay on hover */}
                  <label 
                    className="absolute inset-0 rounded-2xl bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[10px] font-black"
                    title="Upload profile photo"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                    />
                  </label>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {profile?.full_name || 'Registered Patient'}
                    </h2>
                    {isKycVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                        KYC Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                        KYC Pending
                      </span>
                    )}

                    <label className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer inline-flex items-center gap-1 ml-1">
                      <Camera className="w-3 h-3" />
                      <span>Upload Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload} 
                      />
                    </label>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Ayushman Bharat Digital Health Account (ABHA)
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    {abhaNumber ? (
                      <>
                        <span className="text-xs font-mono font-black tracking-wider bg-slate-50 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
                          {abhaNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAbha(abhaNumber)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Copy ABHA ID"
                        >
                          {copiedAbha ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        Complete KYC to Generate ABHA Pass
                      </span>
                    )}
                  </div>

                  {/* Left-Shifted Vitals Row (Blood Group, Age/Gender, Location) */}
                  <div className="flex items-center gap-3 mt-3.5 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Blood:</span>
                      <span className="font-black text-rose-600">
                        {formData.blood_group || patientDetails.blood_group || 'Not Set'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Age/Gender:</span>
                      <span className="font-bold text-slate-800">
                        {patientDetails.age || '--'} / {patientDetails.gender || '--'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400">City:</span>
                      <span className="font-bold text-slate-800">
                        {formData.city || 'Indore'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Square Patient UID QR Code Card with Show QR Button */}
              <div className="flex flex-col items-center justify-center p-3 sm:p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 shrink-0 self-center md:self-auto gap-2">
                <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
                  {profileQrDataUrl ? (
                    <img
                      src={profileQrDataUrl}
                      alt="Patient UID QR"
                      className="w-full h-full object-contain rounded-lg cursor-pointer"
                      onClick={() => setProfileQrModalOpen(true)}
                    />
                  ) : (
                    <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setProfileQrModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Show QR</span>
                </button>
              </div>

            </div>

            {/* =============================================================== */}
            {/* 4. SECTION: VERIFIED IDENTITY (STRICTLY LOCKED / IMMUTABLE)      */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Verified Identity (Locked / Read-Only)
                  </h3>
                </div>
                {isKycVerified ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Govt KYC Authenticated</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>KYC Pending</span>
                  </span>
                )}
              </div>

              {/* Informational Security Alert */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  These credentials are tied to legal clinical records and government authentication. They cannot be modified online. If you need to update any of these details, submit an appeal below to contact support.
                </span>
              </div>

              {/* Locked Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Full Legal Name</span>
                  </span>
                  <span className="text-xs font-black text-slate-800 truncate">
                    {profile?.full_name || 'Not Provided'}
                  </span>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Registered Email Address</span>
                  </span>
                  <span className="text-xs font-black text-slate-800 truncate">
                    {profile?.email || 'Not Provided'}
                  </span>
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Registered Mobile Number</span>
                  </span>
                  <span className="text-xs font-black text-slate-800 truncate">
                    {profile?.phone || 'Not Provided'}
                  </span>
                </div>

                {/* Aadhaar Number */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Aadhaar Number (12-Digit)</span>
                  </span>
                  {aadhaarNumber ? (
                    <span className="text-xs font-mono font-black text-slate-800 tracking-wider">
                      {aadhaarNumber.length >= 8 
                        ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` 
                        : aadhaarNumber}
                    </span>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-600">Not Linked</span>
                      <button
                        type="button"
                        onClick={() => setKycModalOpen(true)}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 underline cursor-pointer"
                      >
                        + Complete KYC
                      </button>
                    </div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Date of Birth</span>
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {patientDetails.date_of_birth || 'Not Provided'}
                  </span>
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Gender</span>
                  </span>
                  <span className="text-xs font-black text-slate-800 capitalize">
                    {patientDetails.gender || 'Not Provided'}
                  </span>
                </div>

              </div>

              {/* APPEAL / CONTACT SUPPORT BANNER */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-2">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Locked fields cannot be changed directly online. Need to correct legal name, phone, or Aadhaar?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(true)}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-600 transition-all cursor-pointer whitespace-nowrap text-left sm:text-right"
                >
                  Appeal to Change / Contact Support →
                </button>
              </div>

            </div>

            {/* =============================================================== */}
            {/* 5. SECTION: GOVERNMENT MEDICAL SCHEMES & INSURANCE (From Step 2) */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Government Medical Scheme & Insurance Coverage
                  </h3>
                </div>
                {govtSchemeType && govtSchemeType !== 'none' ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Active Scheme Linked
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    Private Cashless Care
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Linked Scheme Type */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Healthcare Scheme</span>
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {getSchemeDisplayLabel(govtSchemeType)}
                  </span>
                </div>

                {/* Scheme ID Number */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Scheme ID Number</span>
                  </span>
                  <span className="text-xs font-mono font-black text-slate-800 tracking-wider">
                    {govtSchemeNumber ? (govtSchemeNumber.length > 4 ? `XXXX-${govtSchemeNumber.slice(-4)}` : govtSchemeNumber) : 'Not Provided'}
                  </span>
                </div>

                {/* Insurance Policy Document */}
                <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Insurance Policy Document</span>
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {insuranceDoc || 'No policy document attached'}
                  </span>
                </div>

              </div>

            </div>

            {/* =============================================================== */}
            {/* 6. SECTION: CLINICAL VITALS & HEALTH PROFILE (EDITABLE)         */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Clinical Vitals & Health Profile (Editable)
                  </h3>
                </div>
                {bmiInfo && (
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${bmiInfo.colorClass}`}>
                    BMI: {bmiInfo.value} ({bmiInfo.category})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Blood Group */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Height (cm) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Height (cm)</label>
                  <input 
                    type="number"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    placeholder="e.g. 175"
                    min="50"
                    max="250"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Weight (kg) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Weight (kg)</label>
                  <input 
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="e.g. 72"
                    min="20"
                    max="300"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Family Members Count */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Family Members (Covered)</label>
                  <input 
                    type="number"
                    value={formData.family_members_count}
                    onChange={(e) => setFormData({ ...formData, family_members_count: e.target.value })}
                    min="1"
                    max="20"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

            </div>

            {/* =============================================================== */}
            {/* 7. SECTION: EMERGENCY CONTACTS (EDITABLE)                       */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Heart className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Emergency Medical Contacts
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Contact Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Emergency Contact Person</label>
                  <input 
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="e.g. Spouse, Parent, Sibling"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Contact Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Emergency Phone Number</label>
                  <input 
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

            </div>

            {/* =============================================================== */}
            {/* 8. SECTION: ADDRESS & LOCALIZATION                              */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-4">
              
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Address & Localization Preferences
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                {/* City */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-black text-slate-700">City</label>
                  <input 
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Indore"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* State */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-black text-slate-700">State</label>
                  <input 
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Madhya Pradesh"
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Pincode */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-black text-slate-700">Postal Code</label>
                  <input 
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="452001"
                    maxLength={6}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Language */}
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-black text-slate-700">Preferred Language</label>
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English (India)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Save Profile Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>

      {/* =================================================================== */}
      {/* 9. MODAL: COMPLETE KYC DOCUMENTATION (Exact Onboarding Step 2 Spec) */}
      {/* =================================================================== */}
      {kycModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 animate-scale-up my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">KYC & Government Medical ID</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Verify your identity and link government healthcare schemes for instant cashless eligibility.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKycSubmit} className="flex flex-col gap-6">
              
              {/* Grid of Onboarding Step 2 Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">

                {/* 1. Patient Photo */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Camera className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">1. Patient Photo</span>
                      <span className="text-[10px] text-slate-400">Front-facing profile photo</span>
                    </div>
                  </div>

                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center min-h-[110px]">
                    {kycDetails.photoPreview ? (
                      <div className="flex items-center gap-3">
                        <img src={kycDetails.photoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40" />
                        <span className="text-xs font-bold text-emerald-700">Change Photo</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-800 text-xs">Upload Photo</span>
                        <span className="text-[10px] text-slate-400">JPG, PNG (Max 5MB)</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                {/* 2. Aadhaar Number */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">2. Aadhaar Number <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400">Enter your 12-digit Aadhaar number</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={kycDetails.aadhaarNumber}
                        onChange={handleAadhaarChange}
                        placeholder="e.g. 5829 1049 8921"
                        maxLength={14}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold tracking-wider placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Government Issued Medical ID (Full Width) */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-3 shadow-2xs md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        3. Government Issued Medical Scheme & ID Number
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Select your government healthcare scheme and provide the scheme number
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    
                    {/* Scheme Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-slate-700 text-xs">Medical Scheme Type</label>
                      <div className="relative">
                        <select
                          value={kycDetails.govtMedicalIdType}
                          onChange={(e) => setKycDetails({ ...kycDetails, govtMedicalIdType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                        >
                          <option value="">Select your medical scheme</option>
                          <option value="pmjay">Ayushman Bharat (PM-JAY)</option>
                          <option value="abha">ABHA Health ID / Account</option>
                          <option value="cghs">Central Government Health Scheme (CGHS)</option>
                          <option value="esic">Employees State Insurance (ESIC)</option>
                          <option value="state_bpl">State BPL / Ration Health Scheme</option>
                          <option value="none">None / Direct Private Cashless</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Dynamic Scheme ID Input */}
                    {kycDetails.govtMedicalIdType && kycDetails.govtMedicalIdType !== 'none' ? (
                      <div className="flex flex-col gap-1.5 animate-fade-in">
                        <label className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{getGovtIdInfo().label}</span>
                        </label>
                        <div className="relative">
                          <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={kycDetails.govtMedicalIdNumber}
                            onChange={(e) => setKycDetails({ ...kycDetails, govtMedicalIdNumber: e.target.value })}
                            placeholder={getGovtIdInfo().placeholder}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-emerald-50/20 border border-emerald-500/40 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{getGovtIdInfo().hint}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs italic">
                        {kycDetails.govtMedicalIdType === 'none'
                          ? 'No scheme ID needed for direct private cashless care.'
                          : 'Select a scheme to enter the corresponding identification number.'}
                      </div>
                    )}

                  </div>
                </div>

                {/* 4. Health Insurance Policy Documents (Full Width) */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-3 shadow-2xs md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                      <Shield className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">4. Health Insurance Policy Document (Optional)</span>
                      <span className="text-[10px] text-slate-400">Upload your policy e-card or schedule for instant TPA pre-auth</span>
                    </div>
                  </div>

                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center min-h-[90px]">
                    {kycDetails.insuranceDocFileName ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <FileText className="w-4 h-4" />
                        <span>{kycDetails.insuranceDocFileName}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-800 text-xs">Upload Insurance Document</span>
                        <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max. 10MB)</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setKycDetails({
                            ...kycDetails,
                            insuranceDocFile: file,
                            insuranceDocFileName: file.name
                          });
                        }
                      }} 
                    />
                  </label>
                </div>

              </div>

              {/* Encryption Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-800">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>All documents and government credentials are encrypted under DISHA/HIPAA standards and will be locked upon verification.</span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKycModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kycSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {kycSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Verify & Save KYC</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 10. MODAL: APPEAL TO CHANGE CREDENTIALS / CONTACT SUPPORT           */}
      {/* =================================================================== */}
      {appealModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Appeal Credential Correction</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Submit request to compliance support desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppealModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAppealSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-700">Credential to Correct</label>
                <select
                  value={appealForm.credential_field}
                  onChange={(e) => setAppealForm({ ...appealForm, credential_field: e.target.value })}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full_name">Legal Name</option>
                  <option value="phone">Registered Mobile Number</option>
                  <option value="email">Registered Email Address</option>
                  <option value="aadhaar_number">Aadhaar / National ID Number</option>
                  <option value="date_of_birth">Date of Birth</option>
                  <option value="gender">Gender</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-700">Corrected Value</label>
                <input 
                  type="text"
                  value={appealForm.requested_value}
                  onChange={(e) => setAppealForm({ ...appealForm, requested_value: e.target.value })}
                  placeholder="Enter the correct value"
                  required
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-700">Reason / Justification</label>
                <textarea 
                  rows={3}
                  value={appealForm.justification}
                  onChange={(e) => setAppealForm({ ...appealForm, justification: e.target.value })}
                  placeholder="Explain why this credential needs correction (e.g. spelling error in name, changed mobile number)..."
                  required
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appealSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {appealSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>Submit Appeal to Support</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: HIGH-RES PATIENT UID QR & SCAN ENGINE POPUP                */}
      {/* =================================================================== */}
      {profileQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 flex flex-col gap-5 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Patient QR Pass</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Ayushman Bharat & OpenHealth Verified UID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileQrModalOpen(false);
                  setScannedEhrData(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 gap-3">
              {profileQrDataUrl ? (
                <img 
                  src={profileQrDataUrl} 
                  alt="Enlarged Patient UID QR Code" 
                  className="w-52 h-52 object-contain bg-white p-2 rounded-2xl border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}

              <div className="text-center">
                <h4 className="text-sm font-black text-slate-900">{profile?.full_name || 'Registered Patient'}</h4>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    UID: {patientUid || profile?.id || user?.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(patientUid || profile?.id || user?.id);
                      showToast('Patient UID copied to clipboard!');
                    }}
                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-600 cursor-pointer border border-slate-200"
                    title="Copy UID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scan Engine Test Trigger */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Hospital EHR Scan Engine</span>
                <button
                  type="button"
                  disabled={loadingScanPreview}
                  onClick={handleFetchScannedData}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loadingScanPreview ? 'Retrieving...' : 'Test Scan Engine'}
                </button>
              </div>

              {scannedEhrData ? (
                <div className="mt-2 p-3 rounded-xl bg-white border border-blue-200 text-[11px] flex flex-col gap-1.5 text-slate-700">
                  <div className="flex justify-between font-bold text-blue-900">
                    <span>EHR Status:</span>
                    <span className="text-emerald-700">Verified Database Record</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-bold text-slate-900">{scannedEhrData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blood / Age:</span>
                    <span>{scannedEhrData.bloodGroup} • {scannedEhrData.age} Yrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Records:</span>
                    <span>{scannedEhrData.metrics?.totalDocuments} Docs, {scannedEhrData.metrics?.activeReservations} Holds</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Hospitals scan this QR to instantly retrieve clinical history and ABHA profile.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {profileQrDataUrl && (
                <a
                  href={profileQrDataUrl}
                  download={`OpenHealth-QR-${profile?.full_name || 'Patient'}.png`}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setProfileQrModalOpen(false);
                  setScannedEhrData(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </AppLayout>
  );
}
