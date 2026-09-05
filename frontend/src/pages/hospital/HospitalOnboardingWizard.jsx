import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  BedDouble, 
  HeartPulse, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Info, 
  Lock, 
  Sparkles, 
  Loader2, 
  Plus, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Stethoscope, 
  ShieldAlert, 
  Upload, 
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { supabase } from '../../lib/supabaseClient';
import hospitalPortalService from '../../services/hospitalPortalService';
import HospitalOnboardingValidationService from '../../services/hospitalOnboardingValidationService';

// Indian Locations for instant cascading state/city/PIN
const INDIA_LOCATIONS = {
  'Madhya Pradesh': [
    { city: 'Indore', pin: '452001' },
    { city: 'Bhopal', pin: '462001' },
    { city: 'Jabalpur', pin: '482001' },
    { city: 'Gwalior', pin: '474001' },
    { city: 'Ujjain', pin: '456001' },
    { city: 'Dewas', pin: '455001' },
    { city: 'Ratlam', pin: '457001' }
  ],
  'Maharashtra': [
    { city: 'Mumbai', pin: '400001' },
    { city: 'Pune', pin: '411001' },
    { city: 'Nagpur', pin: '440001' },
    { city: 'Thane', pin: '400601' },
    { city: 'Nashik', pin: '422001' },
    { city: 'Navi Mumbai', pin: '400703' }
  ],
  'Delhi NCR': [
    { city: 'New Delhi', pin: '110001' },
    { city: 'Noida', pin: '201301' },
    { city: 'Gurugram', pin: '122001' },
    { city: 'Faridabad', pin: '121001' },
    { city: 'Ghaziabad', pin: '201001' }
  ],
  'Karnataka': [
    { city: 'Bengaluru', pin: '560001' },
    { city: 'Mysuru', pin: '570001' },
    { city: 'Mangaluru', pin: '575001' },
    { city: 'Hubballi', pin: '580020' }
  ],
  'Gujarat': [
    { city: 'Ahmedabad', pin: '380001' },
    { city: 'Surat', pin: '395001' },
    { city: 'Vadodara', pin: '390001' },
    { city: 'Rajkot', pin: '360001' }
  ],
  'Uttar Pradesh': [
    { city: 'Lucknow', pin: '226001' },
    { city: 'Kanpur', pin: '208001' },
    { city: 'Varanasi', pin: '221001' },
    { city: 'Agra', pin: '282001' }
  ],
  'Tamil Nadu': [
    { city: 'Chennai', pin: '600001' },
    { city: 'Coimbatore', pin: '641001' },
    { city: 'Madurai', pin: '625001' }
  ],
  'Telangana': [
    { city: 'Hyderabad', pin: '500001' },
    { city: 'Warangal', pin: '506001' }
  ],
  'West Bengal': [
    { city: 'Kolkata', pin: '700001' },
    { city: 'Siliguri', pin: '734001' }
  ],
  'Rajasthan': [
    { city: 'Jaipur', pin: '302001' },
    { city: 'Jodhpur', pin: '342001' },
    { city: 'Udaipur', pin: '313001' }
  ]
};

const STANDARD_FACILITY_TYPES = [
  'Multi Super Speciality Hospital',
  'Multi-Speciality Hospital',
  'General Hospital',
  'Specialist Tertiary Hospital',
  'Trauma & Critical Care Center',
  'Maternity & Children Hospital',
  'Multispeciality Medical Clinic',
  '__custom__'
];

const PRESET_BED_TYPES = [
  'HDU (High Dependency Unit)',
  'NICU (Neonatal ICU)',
  'PICU (Pediatric ICU)',
  'Isolation Ward',
  'Deluxe Private Suite',
  'Semi-Private Ward',
  'Emergency Observation Bed',
  'Daycare / Chemotherapy Bed'
];

const DEFAULT_DEPARTMENTS = [
  'General Medicine',
  'Emergency & Trauma',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'General Surgery',
  'Critical Care & Anesthesia',
  'Nephrology'
];

export default function HospitalOnboardingWizard() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { activeHospital, activeHospitalId, refreshHospital } = useHospital();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Step 1: Facility Profile State
  const initialHospName = activeHospital?.name || user?.user_metadata?.hospital_name || '';
  const [profileData, setProfileData] = useState({
    name: initialHospName,
    type: 'Multi Super Speciality Hospital',
    customType: '',
    phone: (profile?.phone || user?.phone || '').replace(/\D/g, '').slice(-10),
    emergency_phone: '',
    email: user?.email || profile?.email || '',
    website: '',
    address: '',
    state: 'Madhya Pradesh',
    city: 'Indore',
    postal_code: '452001',
    description: 'Leading tertiary healthcare provider delivering transparent clinical care.',
    emergency_available: true
  });

  // Step 2: Bed Inventory & Clinical Setup State
  const [generalBeds, setGeneralBeds] = useState({ total: 20, price: 1500 });
  const [icuBeds, setIcuBeds] = useState({ total: 6, price: 9500 });
  const [customBeds, setCustomBeds] = useState([
    { name: 'HDU (High Dependency Unit)', total: 4, price: 4500 }
  ]);
  const [selectedDepartments, setSelectedDepartments] = useState([
    'General Medicine',
    'Emergency & Trauma',
    'Cardiology'
  ]);

  // Step 3: Regulatory KYC State (Skippable)
  const [kycData, setKycData] = useState({
    license_number: '',
    tax_id: '',
    signatory_name: profile?.full_name || '',
    kyc_document_url: '',
    document_name: ''
  });
  const [isKycSkipped, setIsKycSkipped] = useState(false);

  // Sync draft data on mount
  useEffect(() => {
    if (activeHospital) {
      // If hospital already completed onboarding, redirect to dashboard
      if (activeHospital.onboarding_completed === true && currentStep !== 4) {
        navigate('/hospital/dashboard', { replace: true });
        return;
      }

      setProfileData(prev => ({
        ...prev,
        name: activeHospital.name || prev.name,
        type: activeHospital.type || prev.type,
        phone: activeHospital.phone || prev.phone,
        email: activeHospital.email || prev.email,
        address: activeHospital.address || prev.address,
        city: activeHospital.city || prev.city,
        state: activeHospital.state || prev.state,
        postal_code: activeHospital.postal_code || prev.postal_code,
        description: activeHospital.description || prev.description,
        emergency_available: activeHospital.emergency_available !== false
      }));

      if (activeHospital.license_number || activeHospital.tax_id) {
        setKycData(prev => ({
          ...prev,
          license_number: activeHospital.license_number || '',
          tax_id: activeHospital.tax_id || '',
          signatory_name: activeHospital.signatory_name || prev.signatory_name
        }));
      }
    }
  }, [activeHospital, navigate]);

  // State Change -> Cascade City & Postal PIN
  const handleStateChange = (newState) => {
    const citiesList = INDIA_LOCATIONS[newState] || [];
    const firstCity = citiesList.length > 0 ? citiesList[0].city : '';
    const firstPin = citiesList.length > 0 ? citiesList[0].pin : '';

    setProfileData(prev => ({
      ...prev,
      state: newState,
      city: firstCity,
      postal_code: firstPin
    }));
  };

  const handleCityChange = (newCity) => {
    const citiesList = INDIA_LOCATIONS[profileData.state] || [];
    const matched = citiesList.find(c => c.city === newCity);

    setProfileData(prev => ({
      ...prev,
      city: newCity,
      postal_code: matched ? matched.pin : prev.postal_code
    }));
  };

  // Add Custom Bed Type
  const handleAddCustomBed = () => {
    setCustomBeds(prev => [
      ...prev,
      { name: 'NICU (Neonatal ICU)', total: 4, price: 7500 }
    ]);
  };

  // Remove Custom Bed Type
  const handleRemoveCustomBed = (index) => {
    setCustomBeds(prev => prev.filter((_, i) => i !== index));
  };

  // Update Custom Bed Type
  const handleUpdateCustomBed = (index, field, value) => {
    setCustomBeds(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Toggle Department Selection
  const toggleDepartment = (dept) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  // Step 1: Submit & Validate Profile (Mandatory)
  const handleStep1Submit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setValidationErrors({});

    const validation = HospitalOnboardingValidationService.validateFacilityProfile(profileData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setErrorMsg('Please correct the highlighted facility information fields.');
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Submit & Validate Beds & Clinical Setup (Mandatory)
  const handleStep2Submit = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setValidationErrors({});

    const validation = HospitalOnboardingValidationService.validateBedInventory({
      generalBeds,
      icuBeds,
      customBeds,
      departments: selectedDepartments
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setErrorMsg('Please ensure all bed quantities and clinical departments are valid.');
      return;
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Final Onboarding Save (Skippable KYC)
  const handleSaveOnboarding = async (skipKyc = false) => {
    setErrorMsg('');
    setValidationErrors({});

    if (!skipKyc) {
      const kycVal = HospitalOnboardingValidationService.validateKyc(kycData, false);
      if (!kycVal.isValid) {
        setValidationErrors(kycVal.errors);
        setErrorMsg('Please provide regulatory license details or choose to skip for now.');
        return;
      }
    }

    setIsKycSkipped(skipKyc);
    setSubmitting(true);

    try {
      // 1. Resolve Target Hospital ID
      let targetHospitalId = activeHospitalId || activeHospital?.id;
      if (!targetHospitalId) {
        // Provision hospital facility if missing
        const { data: provHosp, error: provErr } = await hospitalPortalService.saveBedCategory(); // triggers fallback or direct
        const { data: provData, error: provRpcErr } = await supabase.rpc('provision_hospital_account', {
          p_hospital_name: profileData.name.trim(),
          p_city: profileData.city || 'Indore',
          p_state: profileData.state || 'Madhya Pradesh',
          p_phone: profileData.phone || null,
          p_type: profileData.type === '__custom__' ? profileData.customType : profileData.type
        });

        if (provRpcErr) throw provRpcErr;
        targetHospitalId = provData?.id;
      }

      if (!targetHospitalId) {
        throw new Error('Unable to resolve hospital facility identity. Please try again.');
      }

      // 2. Prepare Formatted Beds Array with STRICT 0 OCCUPANCY
      const formattedBeds = [
        {
          name: 'General Ward',
          total_beds: parseInt(generalBeds.total, 10) || 0,
          price_per_day: parseFloat(generalBeds.price) || 1500
        },
        {
          name: 'ICU',
          total_beds: parseInt(icuBeds.total, 10) || 0,
          price_per_day: parseFloat(icuBeds.price) || 9500
        },
        ...customBeds.map(b => ({
          name: b.name.trim(),
          total_beds: parseInt(b.total, 10) || 0,
          price_per_day: parseFloat(b.price) || 2500
        }))
      ];

      // 3. Prepare Departments Array
      const formattedDepartments = selectedDepartments.map(dept => ({
        name: dept,
        description: `${dept} clinical service department`
      }));

      // 4. Prepare Payload
      const finalType = profileData.type === '__custom__' ? profileData.customType : profileData.type;
      const payload = {
        profile: {
          name: profileData.name.trim(),
          type: finalType,
          phone: profileData.phone.trim(),
          email: profileData.email.trim(),
          website: profileData.website.trim() || null,
          address: profileData.address.trim(),
          city: profileData.city.trim(),
          state: profileData.state.trim(),
          postal_code: profileData.postal_code.trim() || null,
          description: profileData.description.trim() || null,
          emergency_available: profileData.emergency_available
        },
        beds: formattedBeds,
        departments: formattedDepartments,
        kyc: {
          license_number: skipKyc ? null : (kycData.license_number.trim() || null),
          tax_id: skipKyc ? null : (kycData.tax_id.trim() || null),
          signatory_name: skipKyc ? null : (kycData.signatory_name.trim() || null),
          kyc_document_url: skipKyc ? null : (kycData.kyc_document_url || null),
          is_skipped: skipKyc
        }
      };

      // 5. Execute Secure Onboarding RPC
      await hospitalPortalService.saveOnboarding(targetHospitalId, payload);

      // 6. Refresh Context & Advance to Step 4 (Finish)
      await refreshHospital();
      if (refreshProfile) await refreshProfile();

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to complete hospital onboarding:', err);
      setErrorMsg(err.message || 'Failed to save onboarding configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  // Total Beds Summary Calculator
  const totalBedsCount = (parseInt(generalBeds.total, 10) || 0) + 
                         (parseInt(icuBeds.total, 10) || 0) + 
                         customBeds.reduce((acc, b) => acc + (parseInt(b.total, 10) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col">
      
      {/* ========================================================================= */}
      {/* 1. TOP WIZARD HEADER                                                      */}
      {/* ========================================================================= */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">OpenHealth</span>
                <span className="text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                  Hospital Portal
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                Hospital Facility Onboarding & Operations Suite
              </p>
            </div>
          </div>

          {/* Center: Multi-Step Stepper */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep > 1 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : currentStep === 1 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'
              }`}>
                Facility Profile
              </span>
            </div>

            <div className={`w-8 sm:w-16 h-0.5 -mt-4 mx-1 transition-colors ${
              currentStep > 1 ? 'bg-blue-600' : 'bg-slate-200'
            }`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep > 2 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : currentStep === 2 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'
              }`}>
                Bed & Clinical
              </span>
            </div>

            <div className={`w-8 sm:w-16 h-0.5 -mt-4 mx-1 transition-colors ${
              currentStep > 2 ? 'bg-blue-600' : 'bg-slate-200'
            }`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep > 3 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : currentStep === 3 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'
              }`}>
                KYC (Optional)
              </span>
            </div>

            <div className={`w-8 sm:w-16 h-0.5 -mt-4 mx-1 transition-colors ${
              currentStep > 3 ? 'bg-blue-600' : 'bg-slate-200'
            }`} />

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 4 
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                4
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep === 4 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'
              }`}>
                Live
              </span>
            </div>

          </div>

          {/* Right: Security Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Healthcare Tenant</span>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WIZARD CONTAINER (Left Brand Hero + Right Form)                    */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* Left Hero Card */}
          <div className="w-full lg:w-[380px] shrink-0 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white via-white to-blue-50/60 border border-slate-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-extrabold text-blue-600 tracking-wider uppercase block mb-1">
                OpenHealth Infrastructure
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {currentStep === 4 ? 'Facility Live & Ready.' : 'Setup Your Hospital Operations.'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-3">
                Configure your facility details, real bed capacities, and specialty departments. New accounts start with 100% clean zero-occupancy telemetry.
              </p>

              {/* Live Highlights */}
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Clean Zero Data State</span>
                    <span className="text-[11px] font-medium text-slate-500">0 occupied beds • 0 fake bookings</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Customizable Bed Categories</span>
                    <span className="text-[11px] font-medium text-slate-500">Add General, ICU, HDU, or custom wards</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Skippable KYC Verification</span>
                    <span className="text-[11px] font-medium text-slate-500">Start operations now, verify license later</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Step Summary Pill */}
            <div className="mt-8 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Step {currentStep} of 4</span>
              <span className="text-blue-600 font-black">
                {currentStep === 1 && 'Facility Details (Mandatory)'}
                {currentStep === 2 && 'Bed & Departments (Mandatory)'}
                {currentStep === 3 && 'Accreditation KYC (Skippable)'}
                {currentStep === 4 && 'Complete'}
              </span>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
            
            {/* Global Error Alert Banner */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-semibold animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 1: FACILITY PROFILE (MANDATORY)                            */}
            {/* =============================================================== */}
            {currentStep === 1 && (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep1Submit}
                className="flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-900">Hospital Facility Profile</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Basic identification and contact details for your medical center. Mandatory for tenant provisioning.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Hospital Legal Name */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Hospital Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Amrita Super Speciality Hospital"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          validationErrors.name ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      />
                    </div>
                    {validationErrors.name && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{validationErrors.name}</span>
                    )}
                  </div>

                  {/* Facility Category */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Facility Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={profileData.type}
                      onChange={(e) => setProfileData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {STANDARD_FACILITY_TYPES.map((t, idx) => (
                        <option key={idx} value={t}>
                          {t === '__custom__' ? '+ Custom Facility Type...' : t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Category Input if selected */}
                  {profileData.type === '__custom__' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Specify Custom Type <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Eye & Retina Specialty Hospital"
                        value={profileData.customType}
                        onChange={(e) => setProfileData(prev => ({ ...prev, customType: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  {/* Official Phone Number */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Official Contact Phone <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile or landline"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          validationErrors.phone ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      />
                    </div>
                    {validationErrors.phone && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{validationErrors.phone}</span>
                    )}
                  </div>

                  {/* Emergency Helpline */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      24/7 Emergency Casualty Helpline
                    </label>
                    <div className="relative">
                      <HeartPulse className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="e.g. +91 731 2445566 or 108"
                        value={profileData.emergency_phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Administrative Email */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Administrative Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="email"
                        required
                        placeholder="admin@hospital.org"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          validationErrors.email ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{validationErrors.email}</span>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Hospital Official Website
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="https://hospital.org"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Full Street Address */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Full Campus / Street Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Sector 12, Ring Road, Scheme No 74"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          validationErrors.address ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      />
                    </div>
                    {validationErrors.address && (
                      <span className="text-[11px] font-bold text-rose-600 mt-1 block">{validationErrors.address}</span>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      State / UT <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={profileData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {Object.keys(INDIA_LOCATIONS).map((st, idx) => (
                        <option key={idx} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      City / District <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={profileData.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {(INDIA_LOCATIONS[profileData.state] || []).map((loc, idx) => (
                        <option key={idx} value={loc.city}>{loc.city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Postal PIN */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Postal PIN Code
                    </label>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 452001"
                      value={profileData.postal_code}
                      onChange={(e) => setProfileData(prev => ({ ...prev, postal_code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* 24/7 Casualty Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">24/7 Casualty & Trauma</span>
                      <span className="text-[11px] font-medium text-slate-500">Enable round-the-clock emergency care</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={profileData.emergency_available}
                        onChange={(e) => setProfileData(prev => ({ ...prev, emergency_available: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Step 1 of 4 • Facility Profile
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <span>Continue to Bed & Clinical Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </motion.form>
            )}

            {/* =============================================================== */}
            {/* STEP 2: BED INVENTORY & CLINICAL SETUP (MANDATORY)              */}
            {/* =============================================================== */}
            {currentStep === 2 && (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep2Submit}
                className="flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-lg font-black text-slate-900">Bed Capacity & Ward Configuration</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Input your facility's real General and ICU bed counts. Add custom categories as needed. All units initialize with strictly 0 occupied beds.
                  </p>
                </div>

                {/* Capacity Summary Live Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Total Ward Capacity</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{totalBedsCount} Beds</span>
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          100% Vacant & Ready
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-500 block">Initial Telemetry State</span>
                    <span className="text-xs font-bold text-blue-700">0 Occupied • 0 Reserved • 0 Active Bookings</span>
                  </div>
                </div>

                {/* 1. General Ward Beds Input */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-sm font-black text-slate-900">General Ward Beds</span>
                      <span className="text-[10px] font-bold bg-blue-100/80 text-blue-700 px-2 py-0.5 rounded">Standard Inpatient</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Multi-bed shared recovery ward with 24/7 nursing care.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Beds</label>
                      <input 
                        type="number"
                        min="0"
                        max="999"
                        value={generalBeds.total}
                        onChange={(e) => setGeneralBeds(prev => ({ ...prev, total: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tariff (₹/Day)</label>
                      <input 
                        type="number"
                        min="0"
                        step="100"
                        value={generalBeds.price}
                        onChange={(e) => setGeneralBeds(prev => ({ ...prev, price: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        className="w-28 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ICU Beds Input */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-sm font-black text-slate-900">ICU (Intensive Care Unit)</span>
                      <span className="text-[10px] font-bold bg-rose-100/80 text-rose-700 px-2 py-0.5 rounded">Critical Care</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Equipped with multi-parameter ventilators and continuous telemetry.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Beds</label>
                      <input 
                        type="number"
                        min="0"
                        max="999"
                        value={icuBeds.total}
                        onChange={(e) => setIcuBeds(prev => ({ ...prev, total: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tariff (₹/Day)</label>
                      <input 
                        type="number"
                        min="0"
                        step="500"
                        value={icuBeds.price}
                        onChange={(e) => setIcuBeds(prev => ({ ...prev, price: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        className="w-28 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Dynamically Added Custom Bed Categories */}
                {customBeds.map((bed, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-xs font-extrabold text-indigo-700">Custom Category #{idx + 1}</span>
                      </div>
                      <input 
                        type="text"
                        placeholder="e.g. HDU, NICU, Deluxe Suite"
                        value={bed.name}
                        onChange={(e) => handleUpdateCustomBed(idx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Beds</label>
                        <input 
                          type="number"
                          min="1"
                          max="999"
                          value={bed.total}
                          onChange={(e) => handleUpdateCustomBed(idx, 'total', Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tariff (₹/Day)</label>
                        <input 
                          type="number"
                          min="0"
                          step="200"
                          value={bed.price}
                          onChange={(e) => handleUpdateCustomBed(idx, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomBed(idx)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mt-3.5 cursor-pointer"
                        title="Remove Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* + Add Bed Type Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddCustomBed}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Bed Category (HDU, NICU, Deluxe Suite...)</span>
                  </button>
                </div>

                {/* Clinical Departments Selection */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Active Clinical Departments <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Select the specialty departments available at your medical facility:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {DEFAULT_DEPARTMENTS.map((dept, idx) => {
                      const isSelected = selectedDepartments.includes(dept);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDepartment(dept)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-2xs' 
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{dept}</span>
                        </button>
                      );
                    })}
                  </div>
                  {validationErrors.departments && (
                    <span className="text-[11px] font-bold text-rose-600 mt-2 block">{validationErrors.departments}</span>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <span>Continue to KYC & Accreditation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </motion.form>
            )}

            {/* =============================================================== */}
            {/* STEP 3: REGULATORY KYC & ACCREDITATION (SKIPPABLE)               */}
            {/* =============================================================== */}
            {currentStep === 3 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">Accreditation & Regulatory KYC</h3>
                    <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      Optional / Skippable
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your clinical registration license to earn the OpenHealth Verified Shield. You can complete this now or skip and verify later from your dashboard.
                  </p>
                </div>

                {/* Skippable Guidance Callout */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">
                    <span className="font-bold">Need to access your operational dashboard immediately?</span>{' '}
                    You can click <strong className="font-bold">"Skip KYC for now & verify later"</strong> at the bottom. Your hospital beds, intake roster, and OPD portal will activate immediately with clean zero-occupancy telemetry.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* License Number */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Clinical Establishment / State Health Authority License No.
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="e.g. CEA/MP/IND/2024/9842"
                        value={kycData.license_number}
                        onChange={(e) => setKycData(prev => ({ ...prev, license_number: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Institutional PAN / GSTIN */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Institutional Tax ID / PAN / GSTIN
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. AAACM1234F or 23AAACM1234F1Z5"
                      value={kycData.tax_id}
                      onChange={(e) => setKycData(prev => ({ ...prev, tax_id: e.target.value.toUpperCase() }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Medical Superintendent / Signatory */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Medical Superintendent / Authorized Signatory
                    </label>
                    <input 
                      type="text"
                      placeholder="Dr. Full Name"
                      value={kycData.signatory_name}
                      onChange={(e) => setKycData(prev => ({ ...prev, signatory_name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Document Upload Area */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Registration Certificate / NABH Document (Optional)
                    </label>
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {kycData.document_name || 'Upload Certificate PDF or Scan (Max 5MB)'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Supports PDF, PNG, JPG files
                      </span>
                      <label className="mt-3 px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-blue-600 hover:bg-slate-50 cursor-pointer">
                        <span>Browse File</span>
                        <input 
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setKycData(prev => ({
                                ...prev,
                                document_name: file.name,
                                kyc_document_url: 'uploaded_locally'
                              }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                </div>

                {/* Dual Action Bar: Skip vs Submit */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer self-start sm:self-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Beds</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {/* Explicit "Skip KYC for now" button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSaveOnboarding(true)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                      ) : null}
                      <span>Skip KYC for now & verify later</span>
                    </button>

                    {/* Submit KYC button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSaveOnboarding(false)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>Submit KYC & Complete Setup</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {/* =============================================================== */}
            {/* STEP 4: LAUNCH CONFIRMATION SCREEN                              */}
            {/* =============================================================== */}
            {currentStep === 4 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6 gap-6"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <CheckCheck className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block mb-1">
                    Onboarding Completed
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {profileData.name} is Live!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2">
                    Your facility has been provisioned with zero initial occupancy. All wards and intake portals are now synchronized with live telemetry.
                  </p>
                </div>

                {/* Metric Summary Confirmation */}
                <div className="grid grid-cols-3 gap-3 max-w-lg w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Beds</span>
                    <span className="text-lg font-black text-slate-900">{totalBedsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Occupied Beds</span>
                    <span className="text-lg font-black text-emerald-600">0 Active</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">KYC Status</span>
                    <span className="text-xs font-extrabold text-blue-700 block mt-1">
                      {isKycSkipped ? 'Pending (Optional)' : 'Submitted'}
                    </span>
                  </div>
                </div>

                {isKycSkipped && (
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    💡 You skipped KYC for now. A verification banner will be available on your dashboard whenever you wish to upload your registration license.
                  </p>
                )}

                {/* Launch Dashboard Button */}
                <button
                  type="button"
                  onClick={() => navigate('/hospital/dashboard', { replace: true })}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <span>Enter Hospital Operations Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </motion.div>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
