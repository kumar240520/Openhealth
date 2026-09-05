import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShieldCheck, 
  User, 
  Mail, 
  Calendar, 
  Phone, 
  Users, 
  Droplet, 
  Upload, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Info, 
  Lock, 
  Camera, 
  CreditCard, 
  Building2, 
  Shield, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  ChevronDown,
  TrendingUp,
  BarChart3,
  HeartHandshake,
  Activity,
  MapPin,
  Globe,
  ShieldAlert,
  IdCard,
  Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// Comprehensive Indian Healthcare States, Cities & Primary Postal PIN Codes Map
const INDIA_LOCATIONS = {
  'Madhya Pradesh': [
    { city: 'Indore', pin: '452001' },
    { city: 'Bhopal', pin: '462001' },
    { city: 'Jabalpur', pin: '482001' },
    { city: 'Gwalior', pin: '474001' },
    { city: 'Ujjain', pin: '456001' },
    { city: 'Sagar', pin: '470001' },
    { city: 'Dewas', pin: '455001' },
    { city: 'Satna', pin: '485001' },
    { city: 'Ratlam', pin: '457001' },
    { city: 'Rewa', pin: '486001' },
    { city: 'Katni', pin: '483501' },
    { city: 'Singrauli', pin: '486889' },
    { city: 'Burhanpur', pin: '450331' },
    { city: 'Khandwa', pin: '450001' },
    { city: 'Bhind', pin: '477001' },
    { city: 'Chhindwara', pin: '480001' },
    { city: 'Guna', pin: '473001' },
    { city: 'Shivpuri', pin: '473551' },
    { city: 'Vidisha', pin: '464001' },
    { city: 'Damoh', pin: '470661' },
    { city: 'Mandsaur', pin: '458001' },
    { city: 'Khargone', pin: '451001' },
    { city: 'Neemuch', pin: '458441' },
    { city: 'Pithampur', pin: '454775' }
  ],
  'Maharashtra': [
    { city: 'Mumbai', pin: '400001' },
    { city: 'Pune', pin: '411001' },
    { city: 'Nagpur', pin: '440001' },
    { city: 'Thane', pin: '400601' },
    { city: 'Nashik', pin: '422001' },
    { city: 'Aurangabad (Chhatrapati Sambhajinagar)', pin: '431001' },
    { city: 'Solapur', pin: '413001' },
    { city: 'Navi Mumbai', pin: '400703' },
    { city: 'Kolhapur', pin: '416001' },
    { city: 'Amravati', pin: '444601' }
  ],
  'Delhi NCR': [
    { city: 'New Delhi (Central)', pin: '110001' },
    { city: 'South Delhi', pin: '110017' },
    { city: 'North Delhi', pin: '110007' },
    { city: 'East Delhi', pin: '110092' },
    { city: 'West Delhi', pin: '110027' },
    { city: 'Noida (Gautam Buddha Nagar)', pin: '201301' },
    { city: 'Greater Noida', pin: '201310' },
    { city: 'Gurugram (Gurgaon)', pin: '122001' },
    { city: 'Faridabad', pin: '121001' },
    { city: 'Ghaziabad', pin: '201001' }
  ],
  'Karnataka': [
    { city: 'Bengaluru (Bangalore)', pin: '560001' },
    { city: 'Mysuru (Mysore)', pin: '570001' },
    { city: 'Mangaluru (Mangalore)', pin: '575001' },
    { city: 'Hubballi-Dharwad', pin: '580020' },
    { city: 'Belagavi (Belgaum)', pin: '590001' },
    { city: 'Kalaburagi (Gulbarga)', pin: '585101' },
    { city: 'Davanagere', pin: '577001' },
    { city: 'Ballari (Bellary)', pin: '583101' }
  ],
  'Gujarat': [
    { city: 'Ahmedabad', pin: '380001' },
    { city: 'Surat', pin: '395001' },
    { city: 'Vadodara (Baroda)', pin: '390001' },
    { city: 'Rajkot', pin: '360001' },
    { city: 'Bhavnagar', pin: '364001' },
    { city: 'Jamnagar', pin: '361001' },
    { city: 'Gandhinagar', pin: '382010' },
    { city: 'Anand', pin: '388001' }
  ],
  'Rajasthan': [
    { city: 'Jaipur', pin: '302001' },
    { city: 'Jodhpur', pin: '342001' },
    { city: 'Kota', pin: '324001' },
    { city: 'Bikaner', pin: '334001' },
    { city: 'Ajmer', pin: '305001' },
    { city: 'Udaipur', pin: '313001' },
    { city: 'Bhilwara', pin: '311001' },
    { city: 'Alwar', pin: '301001' }
  ],
  'Uttar Pradesh': [
    { city: 'Lucknow', pin: '226001' },
    { city: 'Kanpur', pin: '208001' },
    { city: 'Varanasi', pin: '221001' },
    { city: 'Agra', pin: '282001' },
    { city: 'Prayagraj (Allahabad)', pin: '211001' },
    { city: 'Meerut', pin: '250001' },
    { city: 'Bareilly', pin: '243001' },
    { city: 'Aligarh', pin: '202001' },
    { city: 'Moradabad', pin: '244001' },
    { city: 'Gorakhpur', pin: '273001' }
  ],
  'Tamil Nadu': [
    { city: 'Chennai', pin: '600001' },
    { city: 'Coimbatore', pin: '641001' },
    { city: 'Madurai', pin: '625001' },
    { city: 'Tiruchirappalli (Trichy)', pin: '620001' },
    { city: 'Salem', pin: '636001' },
    { city: 'Tirunelveli', pin: '627001' }
  ],
  'Telangana': [
    { city: 'Hyderabad', pin: '500001' },
    { city: 'Warangal', pin: '506001' },
    { city: 'Nizamabad', pin: '503001' },
    { city: 'Karimnagar', pin: '505001' },
    { city: 'Khammam', pin: '507001' }
  ],
  'West Bengal': [
    { city: 'Kolkata', pin: '700001' },
    { city: 'Howrah', pin: '711101' },
    { city: 'Durgapur', pin: '713201' },
    { city: 'Siliguri', pin: '734001' },
    { city: 'Asansol', pin: '713301' }
  ],
  'Kerala': [
    { city: 'Thiruvananthapuram', pin: '695001' },
    { city: 'Kochi (Ernakulam)', pin: '682001' },
    { city: 'Kozhikode (Calicut)', pin: '673001' },
    { city: 'Thrissur', pin: '680001' },
    { city: 'Kollam', pin: '691001' }
  ],
  'Punjab & Haryana': [
    { city: 'Chandigarh', pin: '160001' },
    { city: 'Ludhiana', pin: '141001' },
    { city: 'Amritsar', pin: '143001' },
    { city: 'Jalandhar', pin: '144001' },
    { city: 'Gurugram', pin: '122001' },
    { city: 'Faridabad', pin: '121001' },
    { city: 'Panipat', pin: '132103' }
  ]
};

export default function PatientOnboardingWizard() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const dobInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedAbhaId, setGeneratedAbhaId] = useState('');

  // Track initial mount so we don't accidentally redirect while the user is actively viewing Step 3
  const isInitialCheckDone = useRef(false);

  // Pre-calculate initial sign-up metadata
  const initialPhone = (profile?.phone || user?.user_metadata?.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
  const initialName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const initialEmail = user?.email || profile?.email || '';

  // Step 1: Basic & Contact Details Form State
  const [basicDetails, setBasicDetails] = useState({
    fullName: initialName,
    email: initialEmail,
    dateOfBirth: '',
    phone: initialPhone,
    countryCode: '+91',
    age: '',
    gender: '',
    bloodGroup: '',
    familyMembersCount: '1',
    state: 'Madhya Pradesh',
    city: 'Indore',
    postalCode: '452001',
    preferredLanguage: 'en',
    emergencyContactName: '',
    emergencyContactPhone: '',
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    previousReportFile: null,
    previousReportFileName: ''
  });

  // Step 2: KYC Details Form State
  const [kycDetails, setKycDetails] = useState({
    photoFile: null,
    photoPreview: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
    aadhaarNumber: '',
    govtMedicalIdType: '',
    govtMedicalIdNumber: '',
    insuranceDocFile: null,
    insuranceDocFileName: ''
  });

  // Lifecycle check & Prepopulate draft data
  useEffect(() => {
    // Only on initial mount: if already completed onboarding in a previous session, redirect to dashboard
    if (!isInitialCheckDone.current) {
      if (profile?.onboarding_completed === true) {
        navigate('/dashboard/patient', { replace: true });
        return;
      }
      isInitialCheckDone.current = true;
    }

    const resolvedPhone = (profile?.phone || user?.user_metadata?.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
    const resolvedName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
    const resolvedEmail = user?.email || profile?.email || '';

    setBasicDetails(prev => ({
      ...prev,
      fullName: prev.fullName || resolvedName,
      email: prev.email || resolvedEmail,
      phone: prev.phone || resolvedPhone
    }));

    // Load any existing draft data from patient_profiles
    const loadDraftData = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          if (data.onboarding_completed && currentStep !== 3) {
            navigate('/dashboard/patient', { replace: true });
            return;
          }
          setBasicDetails(prev => ({
            ...prev,
            dateOfBirth: data.date_of_birth || prev.dateOfBirth,
            age: data.age ? String(data.age) : prev.age,
            gender: data.gender || prev.gender,
            bloodGroup: data.blood_group || prev.bloodGroup,
            familyMembersCount: data.family_members_count ? String(data.family_members_count) : prev.familyMembersCount,
            state: data.state || prev.state,
            city: data.city || prev.city,
            postalCode: data.postal_code || prev.postalCode,
            preferredLanguage: data.preferred_language || prev.preferredLanguage,
            emergencyContactName: data.emergency_contact_name || prev.emergencyContactName,
            emergencyContactPhone: data.emergency_contact_phone || prev.emergencyContactPhone,
            height: data.height_cm ? String(data.height_cm) : prev.height,
            weight: data.weight_kg ? String(data.weight_kg) : prev.weight,
            previousReportFileName: data.previous_reports_url || prev.previousReportFileName
          }));

          if (data.aadhaar_number || data.govt_id_type || data.govt_id_number) {
            setKycDetails(prev => ({
              ...prev,
              aadhaarNumber: data.aadhaar_number ? data.aadhaar_number.replace(/(\d{4})(?=\d)/g, '$1 ') : prev.aadhaarNumber,
              govtMedicalIdType: data.govt_id_type || prev.govtMedicalIdType,
              govtMedicalIdNumber: data.govt_id_number || prev.govtMedicalIdNumber,
              insuranceDocFileName: data.insurance_policy_url || prev.insuranceDocFileName
            }));
          }
        }
      } catch (err) {
        console.warn('Draft load notice:', err);
      }
    };
    loadDraftData();
  }, [profile, user, navigate, currentStep]);

  // Robust Date of Birth Change & Auto Age Calculation
  const handleDobChange = (rawDate) => {
    let calculatedAge = '';
    if (rawDate) {
      const birthDate = new Date(rawDate);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age >= 0 && age <= 120) {
          calculatedAge = String(age);
        }
      }
    }
    setBasicDetails(prev => ({
      ...prev,
      dateOfBirth: rawDate,
      age: calculatedAge !== '' ? calculatedAge : prev.age
    }));
  };

  // State Change Handler -> Cascades Cities & Auto-fills Primary PIN Code
  const handleStateChange = (selectedState) => {
    const citiesList = INDIA_LOCATIONS[selectedState] || [];
    const firstCity = citiesList.length > 0 ? citiesList[0].city : '';
    const firstPin = citiesList.length > 0 ? citiesList[0].pin : '';

    setBasicDetails(prev => ({
      ...prev,
      state: selectedState,
      city: firstCity,
      postalCode: firstPin
    }));
  };

  // City Change Handler -> Auto-fills Corresponding Postal PIN Code
  const handleCityChange = (selectedCity) => {
    const citiesList = INDIA_LOCATIONS[basicDetails.state] || [];
    const matched = citiesList.find(c => c.city === selectedCity);

    setBasicDetails(prev => ({
      ...prev,
      city: selectedCity,
      postalCode: matched ? matched.pin : prev.postalCode
    }));
  };

  // Format Aadhaar with spaces (XXXX XXXX XXXX)
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setKycDetails(prev => ({ ...prev, aadhaarNumber: formatted }));
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setKycDetails(prev => ({
        ...prev,
        photoFile: file,
        photoPreview: preview
      }));
    }
  };

  // Step 1 Validation & Submit
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!basicDetails.fullName.trim()) {
      setErrorMsg('Please enter the patient full name.');
      return;
    }
    if (!basicDetails.dateOfBirth) {
      setErrorMsg('Please select a valid date of birth.');
      return;
    }
    if (!basicDetails.gender) {
      setErrorMsg('Please select patient gender.');
      return;
    }
    if (!basicDetails.bloodGroup) {
      setErrorMsg('Please select patient blood group.');
      return;
    }
    if (!basicDetails.state.trim()) {
      setErrorMsg('Please select your state.');
      return;
    }
    if (!basicDetails.city.trim()) {
      setErrorMsg('Please select your city/town.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        full_name: basicDetails.fullName.trim(),
        email: basicDetails.email,
        phone: basicDetails.phone,
        date_of_birth: basicDetails.dateOfBirth,
        age: parseInt(basicDetails.age) || null,
        gender: basicDetails.gender,
        blood_group: basicDetails.bloodGroup,
        family_members_count: parseInt(basicDetails.familyMembersCount) || 1,
        state: basicDetails.state.trim(),
        city: basicDetails.city.trim(),
        postal_code: basicDetails.postalCode.trim() || null,
        preferred_language: basicDetails.preferredLanguage || 'en',
        emergency_contact_name: basicDetails.emergencyContactName.trim() || null,
        emergency_contact_phone: basicDetails.emergencyContactPhone.trim() || null,
        height_cm: basicDetails.height ? parseFloat(basicDetails.height) : null,
        weight_kg: basicDetails.weight ? parseFloat(basicDetails.weight) : null,
        previous_reports_url: basicDetails.previousReportFileName || null
      };

      const { data, error } = await supabase.rpc('save_patient_onboarding', {
        p_step: 1,
        p_data: payload
      });

      if (error) throw error;
      setCurrentStep(2);
    } catch (err) {
      console.error('Step 1 save error:', err);
      setErrorMsg(err.message || 'Failed to save basic details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 Validation & Submit (or Skip)
  const handleStep2Submit = async (skip = false) => {
    setErrorMsg('');
    try {
      setSubmitting(true);
      const cleanAadhaar = kycDetails.aadhaarNumber.replace(/\s/g, '');

      if (!skip) {
        if (kycDetails.govtMedicalIdType && kycDetails.govtMedicalIdType !== 'none' && !kycDetails.govtMedicalIdNumber.trim()) {
          setErrorMsg('Please enter your Government Medical ID / Card Number.');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        photo_url: kycDetails.photoPreview || null,
        aadhaar_number: skip ? null : cleanAadhaar,
        govt_id_type: skip ? null : kycDetails.govtMedicalIdType,
        govt_id_number: skip ? null : (kycDetails.govtMedicalIdNumber.trim() || null),
        insurance_policy_url: skip ? null : kycDetails.insuranceDocFileName
      };

      const { data, error } = await supabase.rpc('save_patient_onboarding', {
        p_step: 2,
        p_data: payload
      });

      if (error) throw error;

      // Advance to Finish screen (Step 3) - The user stays on this screen until clicking "Go to Dashboard"
      setCurrentStep(3);
    } catch (err) {
      console.error('Step 2 save error:', err);
      setErrorMsg(err.message || 'Failed to save KYC verification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Triggered ONLY when the user explicitly clicks "Go to Dashboard →"
  const handleFinishAndGoToDashboard = async () => {
    try {
      setFinishing(true);
      const { data, error } = await supabase.rpc('save_patient_onboarding', {
        p_step: 3,
        p_data: {}
      });
      if (error) throw error;

      if (data?.abha_id) {
        setGeneratedAbhaId(data.abha_id);
      }

      await refreshProfile();
      navigate('/dashboard/patient', { replace: true });
    } catch (err) {
      console.error('Finish onboarding error:', err);
      navigate('/dashboard/patient', { replace: true });
    } finally {
      setFinishing(false);
    }
  };

  // Helper for dynamic Govt ID placeholder & label
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
          label: 'Government Medical ID / Card Number',
          placeholder: 'Enter your medical identification number',
          hint: 'Official government healthcare scheme identification number.'
        };
    }
  };

  const currentCityOptions = INDIA_LOCATIONS[basicDetails.state] || [];

  return (
    <div className="min-h-screen bg-[#f3f6fb] font-sans text-slate-800 flex flex-col justify-between selection:bg-emerald-500 selection:text-white pt-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (100% FIXED TO TOP) */}
      {/* ========================================================================= */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 lg:px-12 flex items-center shadow-sm">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#ef4444] flex items-center justify-center shadow-md shadow-red-500/20 flex-shrink-0">
              <div className="relative flex items-center justify-center text-white">
                <Heart className="w-4.5 h-4.5 fill-white text-white" />
                <span className="absolute text-[10px] font-black leading-none text-[#ef4444] select-none">+</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                Open<span className="text-emerald-600">Health</span>
              </span>
              <span className="text-[9px] text-slate-400 font-medium hidden sm:inline">
                Healthcare Discovery & Transparency
              </span>
            </div>
          </div>

          {/* Center: 3-Step Horizontal Stepper with Clean Connected Lines */}
          <div className="flex items-center justify-center flex-1 max-w-md mx-auto">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep > 1 
                  ? 'bg-white text-slate-800 border-2 border-emerald-600 shadow-sm' 
                  : currentStep === 1 
                  ? 'bg-[#047857] text-white ring-4 ring-emerald-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3] text-slate-800" /> : '1'}
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep >= 1 ? 'text-slate-700' : 'text-slate-400'
              }`}>
                Basic Details
              </span>
            </div>

            {/* Line 1 */}
            <div className={`w-12 sm:w-20 md:w-24 h-0.5 -mt-4 mx-1 transition-colors ${
              currentStep > 1 ? 'bg-[#059669]' : 'bg-slate-200'
            }`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep > 2 
                  ? 'bg-white text-slate-800 border-2 border-emerald-600 shadow-sm' 
                  : currentStep === 2 
                  ? 'bg-[#047857] text-white ring-4 ring-emerald-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3] text-slate-800" /> : '2'}
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep >= 2 ? 'text-slate-700' : 'text-slate-400'
              }`}>
                KYC Verification
              </span>
            </div>

            {/* Line 2 */}
            <div className={`w-12 sm:w-20 md:w-24 h-0.5 -mt-4 mx-1 transition-colors ${
              currentStep > 2 ? 'bg-[#059669]' : 'bg-slate-200'
            }`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 3 
                  ? 'bg-[#047857] text-white ring-4 ring-emerald-500/20 shadow-md' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                3
              </div>
              <span className={`text-[11px] font-bold mt-1 whitespace-nowrap ${
                currentStep === 3 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'
              }`}>
                Finish
              </span>
            </div>

          </div>

          {/* Right: Security & Encryption Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Your information is secure and encrypted</span>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WIZARD CONTAINER (Fixed Left Banner & Scrollable Form) */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 lg:px-10 lg:py-6">
        
        <div className="flex flex-col lg:flex-row gap-8 w-full items-start relative">
          
          {/* ===================================================================== */}
          {/* LEFT BANNER CARD (100% FIXED ON DESKTOP - NEVER MOVES) */}
          {/* ===================================================================== */}
          <div className="w-full lg:w-[380px] xl:w-[410px] lg:fixed lg:top-20 lg:bottom-6 p-8 rounded-3xl bg-gradient-to-b from-white via-white to-emerald-50/50 border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden min-h-[480px] lg:h-[calc(100vh-6.5rem)] lg:max-h-[640px] z-20">
            
            {/* Background decorative circles */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/5 -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-blue-500/5 -ml-10 -mb-10 pointer-events-none" />

            <div className="relative z-10">
              {currentStep === 3 ? (
                <>
                  <span className="text-sm font-bold text-slate-700 tracking-tight block mb-1">
                    You're one step closer to
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#059669] tracking-tight leading-tight">
                    better healthcare.
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-3">
                    OpenHealth is here to make your health journey simpler, smarter and stress-free.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase block mb-1">
                    {currentStep === 1 && 'Welcome to'}
                    {currentStep === 2 && 'Secure Your'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {currentStep === 1 && <>Open<span className="text-emerald-600">Health</span></>}
                    {currentStep === 2 && <>Health <span className="text-emerald-600">Journey</span></>}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-3">
                    {currentStep === 1 && "Let's get started with your health journey. Please fill in your basic details to continue."}
                    {currentStep === 2 && "Complete your KYC to unlock a personalized, cashless, and seamless healthcare experience."}
                  </p>
                </>
              )}
            </div>

            {/* 3D Illustration Graphic */}
            <div className="relative z-10 w-full flex items-center justify-center my-4">
              {currentStep === 3 ? (
                /* Step 3: 3D Family & Healthcare Illustration */
                <svg viewBox="0 0 280 260" className="w-60 h-60 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="140" cy="245" rx="100" ry="12" fill="#e2e8f0" />
                  
                  {/* Big Green Heart with ECG Pulse */}
                  <path d="M140 60 C120 20 60 25 50 75 C40 120 100 170 140 195 C180 170 240 120 230 75 C220 25 160 20 140 60 Z" fill="#10b981" />
                  <path d="M70 105 L105 105 L118 80 L135 130 L150 95 L162 115 L175 105 L210 105" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Medical Shield Left */}
                  <path d="M60 140 C80 140 90 155 90 180 C90 205 60 220 60 220 C60 220 30 205 30 180 C30 155 40 140 60 140 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
                  <path d="M60 155 L60 175 M50 165 L70 165" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />

                  {/* Family Avatars */}
                  <circle cx="120" cy="130" r="18" fill="#fed7aa" />
                  <path d="M106 122 C110 112 130 112 134 122" fill="#1e293b" />
                  <circle cx="114" cy="130" r="2" fill="#0f172a" />
                  <circle cx="126" cy="130" r="2" fill="#0f172a" />
                  <path d="M117 137 Q120 141 123 137" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M98 160 C98 150 142 150 142 160 L142 185 L98 185 Z" fill="#059669" />

                  <circle cx="165" cy="135" r="17" fill="#fde68a" />
                  <path d="M150 125 C155 110 178 110 182 125 L184 150 L148 150 Z" fill="#1e293b" />
                  <circle cx="160" cy="136" r="2" fill="#0f172a" />
                  <circle cx="170" cy="136" r="2" fill="#0f172a" />
                  <path d="M162 142 Q165 146 168 142" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M146 165 C146 155 186 155 186 165 L186 190 L146 190 Z" fill="#f8fafc" />

                  <circle cx="140" cy="165" r="14" fill="#fed7aa" />
                  <path d="M128 158 C132 150 148 150 152 158" fill="#1e293b" />
                  <circle cx="135" cy="165" r="1.5" fill="#0f172a" />
                  <circle cx="145" cy="165" r="1.5" fill="#0f172a" />
                  <path d="M138 171 Q140 174 142 171" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M122 188 C122 180 158 180 158 188 L158 210 L122 210 Z" fill="#f59e0b" />

                  {/* Floating Badges */}
                  <rect x="50" y="195" width="28" height="28" rx="7" fill="#3b82f6" />
                  <path d="M64 203 L64 215 M58 209 L70 209" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

                  <rect x="90" y="195" width="28" height="28" rx="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  <path d="M97 203 L111 203 M97 209 L108 209 M97 215 L105 215" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

                  <rect x="130" y="195" width="28" height="28" rx="7" fill="#ef4444" />
                  <path d="M144 203 C140 200 135 204 135 208 C135 214 144 219 144 219 C144 219 153 214 153 208 C153 204 148 200 144 203 Z" fill="#ffffff" />
                </svg>
              ) : (
                /* Step 1 & 2: Clipboard & Stethoscope */
                <svg viewBox="0 0 280 260" className="w-52 h-52 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="140" cy="245" rx="100" ry="12" fill="#e2e8f0" />
                  <rect x="50" y="40" width="145" height="195" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4"/>
                  <rect x="95" y="25" width="55" height="24" rx="8" fill="#334155"/>
                  <circle cx="122.5" cy="37" r="5" fill="#f8fafc" />
                  <rect x="75" y="80" width="18" height="18" rx="5" fill="#d1fae5" />
                  <path d="M79 89 L83 93 L90 85" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="102" y="86" width="75" height="6" rx="3" fill="#e2e8f0"/>

                  <rect x="75" y="115" width="18" height="18" rx="5" fill="#d1fae5" />
                  <path d="M79 124 L83 128 L90 120" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="102" y="121" width="60" height="6" rx="3" fill="#e2e8f0"/>

                  <rect x="75" y="150" width="18" height="18" rx="5" fill="#d1fae5" />
                  <path d="M79 159 L83 163 L90 155" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="102" y="156" width="70" height="6" rx="3" fill="#e2e8f0"/>

                  <path d="M45 150 C30 180 60 230 120 230 C180 230 215 180 215 140" stroke="#0f172a" strokeWidth="6" strokeLinecap="round"/>
                  <circle cx="45" cy="150" r="14" fill="#94a3b8" stroke="#0f172a" strokeWidth="4"/>
                  <circle cx="45" cy="150" r="6" fill="#cbd5e1"/>

                  <path d="M210 160 C235 160 245 175 245 200 C245 225 210 240 210 240 C210 240 175 225 175 200 C175 175 185 160 210 160 Z" fill="url(#shieldGradEmerald)" stroke="#10b981" strokeWidth="3"/>
                  <rect x="202" y="196" width="16" height="6" rx="1.5" fill="#ffffff" />
                  <rect x="207" y="191" width="6" height="16" rx="1.5" fill="#ffffff" />

                  <defs>
                    <linearGradient id="shieldGradEmerald" x1="175" y1="160" x2="245" y2="240" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>

            {/* Bottom feature tag */}
            <div className="relative z-10 flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 p-3 rounded-xl shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Unified ABHA & Emergency ready pass</span>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: STEP FORMS (Directly Pipelined to All DB Columns) */}
          {/* ===================================================================== */}
          <div className="w-full lg:ml-[405px] xl:ml-[435px] flex-1 p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            {/* =================================================================== */}
            {/* STEP 1: BASIC & RESIDENTIAL DETAILS FORM */}
            {/* =================================================================== */}
            {currentStep === 1 && (
              <form onSubmit={handleStep1Submit} className="flex flex-col gap-8">
                
                {/* Form Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center p-3 shadow-inner">
                    <User className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Basic Details (Patient Profile)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Please enter your personal, location and emergency contact information.
                    </p>
                  </div>
                </div>

                {/* Section A: Personal Health Identity */}
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    1. Personal Information
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 text-xs">
                    
                    {/* Full Name */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Full Name (Patient) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={basicDetails.fullName}
                          onChange={(e) => setBasicDetails({ ...basicDetails, fullName: e.target.value })}
                          placeholder="Enter patient full name"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={basicDetails.email}
                          onChange={(e) => setBasicDetails({ ...basicDetails, email: e.target.value })}
                          placeholder="Enter your email address"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Date of Birth with Instant Full Calendar Picker */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <button 
                          type="button" 
                          onClick={() => dobInputRef.current?.showPicker?.()}
                          className="w-10 h-10 flex items-center justify-center text-emerald-600 hover:text-emerald-700 absolute left-1.5 top-1/2 -translate-y-1/2 z-10 cursor-pointer rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Click to open calendar"
                        >
                          <Calendar className="w-5 h-5 stroke-[2.2]" />
                        </button>
                        <input
                          ref={dobInputRef}
                          type="date"
                          required
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                          value={basicDetails.dateOfBirth}
                          onChange={(e) => handleDobChange(e.target.value)}
                          onClick={(e) => e.target.showPicker?.()}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 font-semibold hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2.5">
                        <span className="px-3.5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm flex items-center shadow-sm">
                          +91
                        </span>
                        <div className="relative flex-1">
                          <Phone className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={basicDetails.phone}
                            onChange={(e) => setBasicDetails({ ...basicDetails, phone: e.target.value.replace(/\D/g, '') })}
                            placeholder="Enter your mobile number"
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Age */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        max={120}
                        value={basicDetails.age}
                        onChange={(e) => setBasicDetails({ ...basicDetails, age: e.target.value })}
                        placeholder="Enter your age"
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={basicDetails.gender}
                          onChange={(e) => setBasicDetails({ ...basicDetails, gender: e.target.value })}
                          className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="">Select your gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Blood Group */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Blood Group <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Droplet className="w-4.5 h-4.5 text-red-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          required
                          value={basicDetails.bloodGroup}
                          onChange={(e) => setBasicDetails({ ...basicDetails, bloodGroup: e.target.value })}
                          className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="">Select your blood group</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Family Members Count */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Number of Family Members <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Users className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="number"
                          min={1}
                          max={20}
                          required
                          value={basicDetails.familyMembersCount}
                          onChange={(e) => setBasicDetails({ ...basicDetails, familyMembersCount: e.target.value })}
                          placeholder="Enter number of family members"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section B: Cascading State -> City -> Postal PIN Code Mapping */}
                <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    2. Location & Cascading Address Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    
                    {/* State (Cascades Cities) */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        State <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={basicDetails.state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full px-3.5 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 font-semibold hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          {Object.keys(INDIA_LOCATIONS).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* City (Filtered by Selected State) */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        City / District <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          required
                          value={basicDetails.city}
                          onChange={(e) => handleCityChange(e.target.value)}
                          className="w-full pl-10 pr-8 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 font-semibold hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          {currentCityOptions.map(c => (
                            <option key={c.city} value={c.city}>{c.city}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Postal PIN Code (Auto-populated from selected City) */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5 flex items-center justify-between">
                        <span>PIN / Postal Code</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Auto-filled</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={basicDetails.postalCode}
                        onChange={(e) => setBasicDetails({ ...basicDetails, postalCode: e.target.value.replace(/\D/g, '') })}
                        placeholder="e.g. 452001"
                        className="w-full px-3.5 py-3.5 rounded-xl bg-emerald-50/20 border border-emerald-300/60 text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>

                    {/* Preferred Language */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Preferred Language
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                          value={basicDetails.preferredLanguage}
                          onChange={(e) => setBasicDetails({ ...basicDetails, preferredLanguage: e.target.value })}
                          className="w-full pl-10 pr-8 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="en">English (Default)</option>
                          <option value="hi">Hindi (हिंदी)</option>
                          <option value="mr">Marathi (मराठी)</option>
                          <option value="gu">Gujarati (ગુજરાતી)</option>
                          <option value="ta">Tamil (தமிழ்)</option>
                          <option value="te">Telugu (తెలుగు)</option>
                          <option value="bn">Bengali (বাংলা)</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section C: Emergency Contact Details */}
                <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      3. Emergency Medical Contact (Optional)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 text-xs">
                    
                    {/* Emergency Contact Name */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Emergency Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={basicDetails.emergencyContactName}
                        onChange={(e) => setBasicDetails({ ...basicDetails, emergencyContactName: e.target.value })}
                        placeholder="e.g. Spouse / Parent / Sibling Name"
                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>

                    {/* Emergency Contact Phone */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">
                        Emergency Contact Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          maxLength={10}
                          value={basicDetails.emergencyContactPhone}
                          onChange={(e) => setBasicDetails({ ...basicDetails, emergencyContactPhone: e.target.value.replace(/\D/g, '') })}
                          placeholder="10-digit mobile number"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section D: Physical & Past Reports */}
                <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    4. Physical Metrics & Reports (Optional)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 text-xs">
                    
                    {/* Height */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">Height (Optional)</label>
                      <div className="flex gap-2.5">
                        <input
                          type="number"
                          min={30}
                          max={250}
                          value={basicDetails.height}
                          onChange={(e) => setBasicDetails({ ...basicDetails, height: e.target.value })}
                          placeholder="Enter height"
                          className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                        />
                        <select
                          value={basicDetails.heightUnit}
                          onChange={(e) => setBasicDetails({ ...basicDetails, heightUnit: e.target.value })}
                          className="px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          <option value="cm">cm</option>
                          <option value="ft">ft</option>
                        </select>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="flex flex-col">
                      <label className="font-bold text-[13px] text-slate-700 block mb-2.5">Weight (Optional)</label>
                      <div className="flex gap-2.5">
                        <input
                          type="number"
                          min={2}
                          max={300}
                          value={basicDetails.weight}
                          onChange={(e) => setBasicDetails({ ...basicDetails, weight: e.target.value })}
                          placeholder="Enter weight"
                          className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all shadow-sm"
                        />
                        <select
                          value={basicDetails.weightUnit}
                          onChange={(e) => setBasicDetails({ ...basicDetails, weightUnit: e.target.value })}
                          className="px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Upload Reports */}
                  <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs mt-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">
                        Upload Previous Medical Reports (Optional)
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5">
                        {basicDetails.previousReportFileName || 'Upload prescription or diagnostic reports (PDF only, max 10MB)'}
                      </span>
                    </div>
                    <label className="px-5 py-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 font-bold cursor-pointer flex items-center gap-2 shadow-sm flex-shrink-0 transition-colors">
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>{basicDetails.previousReportFileName ? 'Change PDF' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBasicDetails({
                              ...basicDetails,
                              previousReportFile: file,
                              previousReportFileName: file.name
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Footer Next CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>All fields marked with <span className="text-red-500">*</span> are mandatory</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-9 py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Next Step</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* =================================================================== */}
            {/* STEP 2: KYC & GOVERNMENT MEDICAL ID VERIFICATION */}
            {/* =================================================================== */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-8">
                
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center p-3 shadow-inner">
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      KYC & Government Medical ID
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Verify your identity and link government healthcare schemes for instant cashless eligibility.
                    </p>
                  </div>
                </div>

                {/* Skip Notice Banner */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                  <Info className="w-4.5 h-4.5 text-slate-500 flex-shrink-0" />
                  <span>You can skip this step and complete your KYC later from your profile or settings.</span>
                </div>

                {/* KYC Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  
                  {/* 1. Patient Photo */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block mb-1">1. Patient Photo <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-slate-400">Upload a clear photo of the patient (Front-facing)</span>
                      </div>
                    </div>

                    <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center min-h-[130px]">
                      {kycDetails.photoPreview ? (
                        <div className="flex items-center gap-3.5">
                          <img src={kycDetails.photoPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover ring-4 ring-emerald-500/30" />
                          <span className="text-xs font-bold text-emerald-700">Change Photo</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="font-bold text-slate-800 text-xs">Upload Photo</span>
                          <span className="text-[11px] text-slate-400">JPG, PNG (Max. 5MB)</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>

                  {/* 2. Aadhaar Number */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block mb-1">2. Aadhaar Number <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-slate-400">Enter your 12 digit Aadhaar number</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2">
                      <div className="relative">
                        <CreditCard className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={kycDetails.aadhaarNumber}
                          onChange={handleAadhaarChange}
                          placeholder="Enter your 12 digit Aadhaar number"
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 font-semibold tracking-wider placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Government Issued Medical ID (With DYNAMIC INPUT BOX) */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block mb-1">
                          3. Government Issued Medical Scheme & ID Number <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Select your active government healthcare scheme and provide the identification number
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      
                      {/* Scheme Dropdown */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-slate-700 text-xs">Medical Scheme Type</label>
                        <div className="relative">
                          <select
                            value={kycDetails.govtMedicalIdType}
                            onChange={(e) => setKycDetails({ ...kycDetails, govtMedicalIdType: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 appearance-none cursor-pointer shadow-sm"
                          >
                            <option value="">Select your government medical ID type</option>
                            <option value="pmjay">Ayushman Bharat (PM-JAY)</option>
                            <option value="abha">ABHA Health ID / Account</option>
                            <option value="cghs">Central Government Health Scheme (CGHS)</option>
                            <option value="esic">Employees State Insurance (ESIC)</option>
                            <option value="state_bpl">State BPL / Ration Health Scheme</option>
                            <option value="none">None / Direct Cashless Patient</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* DYNAMIC INPUT BOX FOR GOVT ID NUMBER */}
                      {kycDetails.govtMedicalIdType && kycDetails.govtMedicalIdType !== 'none' ? (
                        <div className="flex flex-col gap-1.5 animate-fadeIn">
                          <label className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                            <IdCard className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{getGovtIdInfo().label} <span className="text-red-500">*</span></span>
                          </label>
                          <div className="relative">
                            <Hash className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={kycDetails.govtMedicalIdNumber}
                              onChange={(e) => setKycDetails({ ...kycDetails, govtMedicalIdNumber: e.target.value })}
                              placeholder={getGovtIdInfo().placeholder}
                              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-emerald-50/20 border-2 border-emerald-500/40 text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-sm transition-all"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 pl-1">{getGovtIdInfo().hint}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs italic">
                          {kycDetails.govtMedicalIdType === 'none' 
                            ? 'No government ID required for direct private cashless care.' 
                            : 'Select a scheme from the left to enter your scheme ID number.'}
                        </div>
                      )}

                    </div>

                    <span className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      💡 Supporting Schemes: Ayushman Bharat (PM-JAY), National Digital Health Mission (ABHA), Central Government Health Scheme (CGHS), ESIC Pehchan, State BPL Health cards.
                    </span>
                  </div>

                  {/* 4. Insurance Policy Documents (Optional) */}
                  <div className="p-6 rounded-2xl border border-slate-200/90 bg-white flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block mb-1">4. Health Insurance Policy Documents (Optional)</span>
                        <span className="text-[11px] text-slate-400">Upload your health insurance policy e-card or schedule for instant TPA pre-authorization</span>
                      </div>
                    </div>

                    <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all text-center min-h-[110px]">
                      {kycDetails.insuranceDocFileName ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                          <FileText className="w-4 h-4" />
                          <span>{kycDetails.insuranceDocFileName}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="font-bold text-slate-800 text-xs">Upload Insurance Document</span>
                          <span className="text-[11px] text-slate-400">JPG, PNG, PDF (Max. 10MB)</span>
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
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3 text-xs sm:text-sm text-blue-800">
                  <Lock className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
                  <span>Your documents and identification details are strictly encrypted under DISHA/HIPAA standards.</span>
                </div>

                {/* Footer Buttons: Skip vs Next */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleStep2Submit(true)}
                    disabled={submitting}
                    className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span>» Skip this KYC for now</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep2Submit(false)}
                      disabled={submitting}
                      className="px-9 py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete & Generate Pass</span>
                          <ArrowRight className="w-4 h-4 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* =================================================================== */}
            {/* STEP 3: FINISH & WELCOME TO OPENHEALTH (Pixel-Perfect from Ref Image) */}
            {/* =================================================================== */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6 py-2">
                
                {/* 1. Header Welcome Section */}
                <div className="flex flex-col sm:flex-row items-start gap-6 pb-2">
                  
                  {/* Glowing Checkmark with Confetti Dots */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-50">
                      <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                    {/* Confetti particles */}
                    <span className="absolute -top-1 left-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="absolute top-2 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="absolute -bottom-1 left-4 w-2 h-2 rounded-full bg-pink-500" />
                    <span className="absolute bottom-2 -right-2 w-2 h-2 rounded-full bg-purple-500" />
                    <span className="absolute -top-2 right-4 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>

                  {/* Welcome Headlines & Description */}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                      Welcome to <span className="text-[#059669]">OpenHealth!</span> 🎉
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-emerald-700">
                      You're all set and ready to take control of your health.
                    </p>
                    <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed mt-1">
                      Thank you for joining OpenHealth. We're on a mission to bring transparency, technology and trust together so you can access the best healthcare with confidence. Explore, compare, decide and take action — all in one place.
                    </p>
                  </div>
                </div>

                {/* 2. Centered Section Divider with Heart Pulse */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative bg-white px-4 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span>With OpenHealth, you can</span>
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Activity className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

                {/* 3. Four Feature Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-left">
                  
                  {/* Card 1: Find the right hospitals & doctors */}
                  <div className="p-5 rounded-2xl bg-[#f0fdfa]/80 border border-teal-100/90 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        Find the right hospitals & doctors
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Search, compare and choose the best care near you.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Access transparent healthcare information */}
                  <div className="p-5 rounded-2xl bg-[#f0f9ff]/80 border border-blue-100/90 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        Access transparent healthcare information
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Real-time availability, treatment info, cost estimates and more.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Secure your health records */}
                  <div className="p-5 rounded-2xl bg-[#faf5ff]/80 border border-purple-100/90 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        Secure your health records
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Your data is safe, encrypted and always accessible.
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Manage your health journey */}
                  <div className="p-5 rounded-2xl bg-[#fff1f2]/80 border border-rose-100/90 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                        Manage your health journey
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Appointments, reports, prescriptions and reminders — easily.
                      </p>
                    </div>
                  </div>

                </div>

                {/* 4. Assurance Green Pill Banner */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex items-center gap-3.5 text-xs text-left my-1">
                  <div className="w-9 h-9 rounded-full bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Heart className="w-4.5 h-4.5 fill-emerald-600 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs sm:text-sm text-emerald-900">
                      Your health matters. Your data is yours. Your journey is our priority.
                    </span>
                    <span className="text-[11px] text-emerald-700 mt-0.5">
                      We're with you, every step of the way.
                    </span>
                  </div>
                </div>

                {/* 5. Footer CTA Action */}
                <div className="flex flex-col items-end pt-3 gap-2">
                  <button
                    type="button"
                    disabled={finishing}
                    onClick={handleFinishAndGoToDashboard}
                    className="px-12 py-3.5 rounded-2xl bg-[#047857] hover:bg-[#065f46] text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-emerald-700/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {finishing ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        <span>Entering Dashboard...</span>
                      </>
                    ) : (
                      <>
                        <span>Go to Dashboard</span>
                        <ArrowRight className="w-4.5 h-4.5 stroke-[3]" />
                      </>
                    )}
                  </button>
                  <span className="text-xs text-slate-500 font-medium pr-1">
                    Let's start your smarter healthcare journey! 💚
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. COMPACT FOOTER */}
      {/* ========================================================================= */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        <span>© 2026 OpenHealth Platform. All healthcare data strictly encrypted under HIPAA/DISHA guidelines.</span>
      </footer>

    </div>
  );
}
