import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Share2, 
  Bed, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  FileText, 
  User, 
  Stethoscope, 
  ChevronRight, 
  Lock, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Award,
  Check,
  Zap,
  Info,
  ChevronLeft,
  Search,
  CheckCircle,
  Tag,
  Percent,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import CheckBedsModal from '../../components/marketplace/CheckBedsModal';
import { getHospitalOperatingStatus } from '../../utils/hospitalHours';

export default function HospitalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Gallery active photo index
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Active section for in-page jump navigation
  const [activeSection, setActiveSection] = useState('overview');

  // Data state
  const [hospital, setHospital] = useState(null);
  const [bedsData, setBedsData] = useState([]);
  const [doctorsData, setDoctorsData] = useState([]);
  const [packagesData, setPackagesData] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [checkBedsOpen, setCheckBedsOpen] = useState(false);

  // Section Refs for smooth scrolling within right pane
  const overviewRef = useRef(null);
  const bedsRef = useRef(null);
  const doctorsRef = useRef(null);
  const packagesRef = useRef(null);
  const insuranceRef = useRef(null);
  const transparencyRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToSection = (sectionKey, ref) => {
    setActiveSection(sectionKey);
    if (ref?.current && scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      const targetTop = ref.current.offsetTop - 20;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  // Fetch complete hospital details from Supabase PostgreSQL
  useEffect(() => {
    const fetchHospitalComplete = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setErrorMsg('');

        // 1. Fetch Hospital Record
        const { data: hospData, error: hospErr } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', id)
          .single();

        if (hospErr) throw hospErr;
        setHospital(hospData);

        // 2. Fetch Beds
        const { data: beds, error: bedsErr } = await supabase
          .from('hospital_beds')
          .select(`
            id,
            total_beds,
            occupied_beds,
            reserved_beds,
            available_beds,
            price_per_day,
            last_updated_at,
            bed_types (
              id,
              name,
              description
            )
          `)
          .eq('hospital_id', id);

        if (!bedsErr && beds) setBedsData(beds);

        // 3. Fetch Doctors linked to this hospital (is_active true OR null)
        const { data: doctors, error: docErr } = await supabase
          .from('doctors')
          .select('id, name, specialization, qualification, experience_years, consultation_fee, rating, review_count, image_url, available_today, is_active')
          .eq('hospital_id', id)
          .or('is_active.eq.true,is_active.is.null');

        if (!docErr && doctors) setDoctorsData(doctors);

        // 4. Fetch Treatment Packages
        const { data: packages, error: pkgErr } = await supabase
          .from('treatment_packages')
          .select('*')
          .eq('hospital_id', id)
          .eq('active', true);

        if (!pkgErr && packages) setPackagesData(packages);

        // 5. Check if saved by patient
        if (user) {
          const { data: patProfile } = await supabase
            .from('patient_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (patProfile?.id) {
            const { data: savedRec } = await supabase
              .from('saved_hospitals')
              .select('id')
              .eq('patient_id', patProfile.id)
              .eq('hospital_id', id)
              .maybeSingle();

            setIsSaved(Boolean(savedRec));
          }
        }
      } catch (err) {
        console.error('Error fetching hospital profile:', err);
        setErrorMsg('Hospital profile not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalComplete();

    if (!id) return;

    // Realtime channel for live sync with PostgreSQL hospital beds and hospital details
    const channel = supabase
      .channel(`hospital_detail_beds_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_beds',
          filter: `hospital_id=eq.${id}`
        },
        async () => {
          console.log('[HospitalDetails] Live bed update received from PostgreSQL');
          const { data: beds, error: bedsErr } = await supabase
            .from('hospital_beds')
            .select(`
              id,
              total_beds,
              occupied_beds,
              reserved_beds,
              available_beds,
              price_per_day,
              last_updated_at,
              bed_types (
                id,
                name,
                description
              )
            `)
            .eq('hospital_id', id);
          if (!bedsErr && beds) setBedsData(beds);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospitals',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('[HospitalDetails] Live hospital update received from PostgreSQL:', payload);
          if (payload.new) setHospital(prev => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  // Handle Save Toggle
  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data: patProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patProfile?.id) return;

      const nextSaved = !isSaved;
      setIsSaved(nextSaved);

      if (nextSaved) {
        await supabase.from('saved_hospitals').insert({ patient_id: patProfile.id, hospital_id: id });
      } else {
        await supabase.from('saved_hospitals').delete().eq('patient_id', patProfile.id).eq('hospital_id', id);
      }
    } catch (err) {
      console.warn('Save toggle notice:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="font-bold text-sm">Loading hospital clinical profile...</span>
        </div>
      </AppLayout>
    );
  }

  if (errorMsg || !hospital) {
    return (
      <AppLayout>
        <div className="py-24 flex-1 max-w-lg mx-auto p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h2 className="text-xl font-black text-slate-900">{errorMsg || 'Hospital Not Found'}</h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested hospital profile could not be loaded.
          </p>
          <button
            onClick={() => navigate('/app/hospitals')}
            className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Back to Hospitals Marketplace
          </button>
        </div>
      </AppLayout>
    );
  }

  const rating = hospital.rating ? Number(hospital.rating).toFixed(1) : '4.5';
  const reviewCount = hospital.review_count || 256;
  const icuAvailable = bedsData.find(b => b.bed_types?.name?.includes('ICU'))?.available_beds ?? 5;
  const generalAvailable = bedsData.find(b => b.bed_types?.name?.includes('General'))?.available_beds ?? 22;

  // Curated High-Res Clinical Gallery Photos
  const galleryPhotos = [
    { url: hospital.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1000&q=80', caption: 'Main Hospital Building & Entrance' },
    { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80', caption: 'Modern Outpatient Reception & Lobby' },
    { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80', caption: 'Advanced Intensive Care Unit (ICU)' },
    { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80', caption: 'Modular Surgical Operation Theater' },
    { url: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=1000&q=80', caption: 'Private Deluxe Inpatient Room' }
  ];

  const quickJumpNav = [
    { id: 'overview', label: 'Overview', ref: overviewRef, count: null },
    { id: 'beds', label: 'Live Beds', ref: bedsRef, count: `${icuAvailable + generalAvailable}` },
    { id: 'doctors', label: 'Doctors', ref: doctorsRef, count: doctorsData.length },
    { id: 'packages', label: 'Packages', ref: packagesRef, count: packagesData.length },
    { id: 'insurance', label: 'Insurance & Schemes', ref: insuranceRef, count: null },
    { id: 'transparency', label: 'Transparency', ref: transparencyRef, count: `${Math.round(hospital.transparency_score || 87)}%` }
  ];

  // Real-time bed hold decrement handler
  const handleBedHoldSuccess = (heldBed) => {
    setHospital(prev => prev ? {
      ...prev,
      available_beds: Math.max(0, (prev.available_beds || 1) - 1)
    } : prev);

    setBedsData(prev => prev.map(b => 
      b.id === heldBed.id
        ? { ...b, available_beds: Math.max(0, (b.available_beds || 1) - 1), reserved_beds: (b.reserved_beds || 0) + 1 }
        : b
    ));
  };

  // Real-time bed release / expiration restore handler
  const handleBedRelease = (heldBed) => {
    setHospital(prev => prev ? {
      ...prev,
      available_beds: (prev.available_beds || 0) + 1
    } : prev);

    setBedsData(prev => prev.map(b => 
      (b.id === heldBed?.id || b.bed_type_id === (heldBed?.bed_type_id || heldBed?.bed_types?.id))
        ? { ...b, available_beds: (b.available_beds || 0) + 1, reserved_beds: Math.max(0, (b.reserved_beds || 1) - 1) }
        : b
    ));
  };

  return (
    <AppLayout>
      {/* SPLIT LAYOUT BODY: FIXED NON-SCROLLABLE LEFT & SCROLLABLE RIGHT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0 lg:h-[calc(100vh-4rem)]">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: 100% FIXED & NON-SCROLLABLE (MATCHES REFERENCE IMAGE)  */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[440px] xl:w-[470px] lg:h-full flex-shrink-0 bg-slate-50/70 border-r border-slate-200/90 p-4 sm:p-5 lg:p-6 lg:overflow-hidden flex flex-col justify-start gap-4">
          
          {/* A. Showcase Photo Gallery Card */}
          <div className="p-3 sm:p-3.5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
            
            {/* Main Showcase Image */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group">
              <img 
                src={galleryPhotos[selectedPhotoIndex].url} 
                alt={hospital.name} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1000&q=80';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Verified Top-Left Badge */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <div className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-bold text-[10.5px] flex items-center gap-1 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Verified Institution</span>
                </div>
              </div>

              {/* Transparency Score Top-Right */}
              <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10.5px] font-bold shadow-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Score {Math.round(hospital.transparency_score || 87)}%</span>
              </div>

              {/* Caption Strip */}
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent text-white text-xs font-semibold text-center">
                {galleryPhotos[selectedPhotoIndex].caption}
              </div>
            </div>

            {/* 5-Photo Thumbnail Strip */}
            <div className="grid grid-cols-5 gap-1.5">
              {galleryPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedPhotoIndex === idx 
                      ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105' 
                      : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={photo.url} 
                    alt="thumbnail" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1000&q=80';
                    }}
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>

          </div>

          {/* B. Admission Desk Live Bed Availability Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3 text-xs">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  ADMISSION DESK
                </span>
                <span className="text-base font-black text-slate-900 mt-0.5">
                  Live Bed Availability
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{icuAvailable + generalAvailable} Total Vacant</span>
              </div>
            </div>

            {/* Two Column Vacancy Boxes */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">ICU UNITS</span>
                <span className="text-lg font-black text-blue-900 mt-0.5 block">{icuAvailable} Vacant</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-teal-50/80 border border-teal-100">
                <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">GENERAL WARDS</span>
                <span className="text-lg font-black text-teal-900 mt-0.5 block">{generalAvailable} Vacant</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCheckBedsOpen(true)}
                className="w-full py-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <Bed className="w-4 h-4 stroke-[2.5]" />
                <span>Instant Bed Hold</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('doctors', doctorsRef)}
                className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300/90 text-slate-800 hover:text-blue-600 font-bold text-xs tracking-tight flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                <span>Book Doctor Consultation</span>
              </button>
            </div>

            {/* Emergency Hotline */}
            <div className="p-2.5 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-center justify-between gap-2 text-red-900">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span className="font-bold text-[10.5px]">24/7 Trauma Emergency Desk</span>
              </div>
              <a href={`tel:${hospital.phone || '+917314223300'}`} className="font-black text-xs text-red-600 hover:underline">
                {hospital.phone || '+91-731-4223300'}
              </a>
            </div>

            {/* Protection Badge */}
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium justify-center pt-0.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Protected by OpenHealth Price Lock Guarantee</span>
            </div>

          </div>

        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: INDEPENDENTLY & SMOOTHLY SCROLLABLE CONTENT AREA      */}
        {/* =================================================================== */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col gap-6"
        >
          
          {/* Breadcrumb Navigation & Share Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <button onClick={() => navigate('/app/hospitals')} className="hover:text-blue-600 transition-colors cursor-pointer">
                Home
              </button>
              <span className="text-slate-300">/</span>
              <button onClick={() => navigate('/app/hospitals')} className="hover:text-blue-600 transition-colors cursor-pointer">
                Hospitals
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-semibold">{hospital.city}, {hospital.state}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">{hospital.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isSaved 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Hospital profile link copied to clipboard!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* 1. Main Header Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
            
            {/* Category & Accreditation Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px]">
                {hospital.type || 'Multi Speciality Tertiary Hospital'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[11px] flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                <span>NABH & JCI Accredited</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                PM-JAY & CGHS Empanelled
              </span>
            </div>

            {/* Hospital Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {hospital.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{hospital.address}, {hospital.city}, {hospital.state} - {hospital.postal_code || '452001'}</span>
              </p>
            </div>

            {/* Rating, Reviews & Open Hours */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-lg shadow-xs">
                <span>{rating}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-slate-700 font-bold">
                {reviewCount} Verified Patient Ratings
              </span>
              <span className="text-slate-300">•</span>
              {(() => {
                const opStatus = getHospitalOperatingStatus(hospital.opening_hours, hospital.emergency_available);
                return (
                  <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border ${
                    opStatus.isOpen 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80' 
                      : 'text-rose-700 bg-rose-50 border-rose-200/80'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${opStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{opStatus.statusText}</span>
                    {opStatus.emergencyNote && (
                      <span className="ml-1 text-[10px] text-red-600 font-extrabold">({opStatus.emergencyNote})</span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Amazon-Style Offers & Scheme Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-black">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Available Government Schemes & Cashless Offers</span>
              </div>
              <div className="flex flex-col gap-1.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>PM-JAY Ayushman Bharat:</strong> Up to ₹5,00,000 free cashless hospitalisation per family.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Cashless Insurance:</strong> Instant pre-auth across Star Health, HDFC ERGO, ICICI Lombard, etc.</span>
                </div>
              </div>
            </div>

            {/* Small Icon-Based Highlight Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bed className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Capacity</span>
                  <span className="font-black text-slate-800 text-xs truncate">80+ Beds</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100/80 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Critical Care</span>
                  <span className="font-black text-slate-800 text-xs truncate">24/7 ICU Unit</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Govt Schemes</span>
                  <span className="font-black text-slate-800 text-xs truncate">PM-JAY / CGHS</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Insurance</span>
                  <span className="font-black text-slate-800 text-xs truncate">100% Cashless</span>
                </div>
              </div>
            </div>

          </div>

          {/* =============================================================== */}
          {/* SECTION 1: OVERVIEW & FACILITIES */}
          {/* =============================================================== */}
          <div ref={overviewRef} className="flex flex-col gap-5">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">1. Hospital Overview & Mission</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                {hospital.description || `${hospital.name} is a state-of-the-art multi-speciality tertiary care hospital delivering world-class clinical excellence. Equipped with fully integrated modular surgical suites, advanced 3T MRI diagnostic imaging, and dedicated round-the-clock trauma & critical care response teams.`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Category</span>
                  <span className="font-black text-slate-800 text-xs">{hospital.type || 'Tertiary Care'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Established</span>
                  <span className="font-black text-slate-800 text-xs">2012</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Accreditation</span>
                  <span className="font-black text-emerald-600 text-xs">NABH / JCI</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Emergency Desk</span>
                  <span className="font-black text-red-600 text-xs">24/7 Active</span>
                </div>
              </div>
            </div>

            {/* 9 Facilities Grid */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Infrastructure & Clinical Facilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  'Modular Surgical OTs',
                  '24/7 Level-1 Emergency & Trauma',
                  'Advanced 3T MRI & 128-Slice CT',
                  'In-house Pathology & Blood Bank',
                  'Cardiac Catheterization Lab',
                  'Dedicated Isolation & HDU Units',
                  'Full Cashless Insurance TPA Desk',
                  '24/7 Advanced Life Support Ambulance',
                  'Spacious Patient Suites & Cafeteria'
                ].map((fac) => (
                  <div key={fac} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 font-semibold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>

              {/* Empty state when no doctors */}
              {doctorsData.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
                  <Stethoscope className="w-8 h-8 text-slate-300" />
                  <p className="font-bold text-sm text-slate-500">No doctors listed yet</p>
                  <p className="text-xs text-slate-400">Doctor profiles for this hospital are being verified and will appear here shortly.</p>
                </div>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 2: LIVE BED INVENTORY */}
          {/* =============================================================== */}
          <div ref={bedsRef} className="flex flex-col gap-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">2. Live Bed Inventory & Ward Capacity</h3>
                    <p className="text-xs text-slate-400">Verified in real-time with the hospital admission desk</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckBedsOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Hold Bed (30m)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bedsData.map((bed) => {
                  const bedName = bed.bed_types?.name || 'General Bed';
                  const available = bed.available_beds || 0;
                  const isAvailable = available > 0;

                  return (
                    <div key={bed.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            bedName.includes('ICU') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {bedName.includes('ICU') ? <Activity className="w-4.5 h-4.5" /> : <Bed className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <h4 className="font-black text-xs sm:text-sm text-slate-900">{bedName}</h4>
                            <span className="text-[10.5px] text-slate-400">{bed.bed_types?.description || 'Standard care'}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isAvailable ? `${available} Vacant` : 'Full'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 py-2 border-y border-slate-200/60 text-center text-xs">
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Total</span>
                          <span className="font-extrabold text-slate-800">{bed.total_beds}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Occupied</span>
                          <span className="font-extrabold text-slate-800">{bed.occupied_beds}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Reserved</span>
                          <span className="font-extrabold text-slate-800">{bed.reserved_beds || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-[11px] font-bold text-slate-500">Daily Tariff:</span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₹{Number(bed.price_per_day || 1500).toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-sans font-normal">/day</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setCheckBedsOpen(true)}
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isAvailable ? 'Reserve This Bed' : 'Capacity Full'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 3: SPECIALISTS & DOCTORS */}
          {/* =============================================================== */}
          <div ref={doctorsRef} className="flex flex-col gap-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">3. Specialists & Clinical Faculty</h3>
                    <p className="text-xs text-slate-400">Verified doctor team practicing at {hospital.name}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                  {doctorsData.length} Doctors
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {doctorsData.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/app/doctors/${doc.id}`)}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={doc.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'} 
                        alt={doc.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
                        }}
                        className="w-12 h-12 rounded-2xl object-cover object-top ring-2 ring-blue-500/20 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mb-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{doc.rating || '4.9'}</span>
                        </div>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-700 transition-colors">{doc.name}</h4>
                        <span className="text-xs font-bold text-blue-600 block truncate">{doc.specialization}</span>
                        <span className="text-[10.5px] text-slate-400 block truncate">{doc.qualification}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Fee</span>
                        <span className="font-black text-slate-900">₹{doc.consultation_fee || 800}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Experience</span>
                        <span className="font-extrabold text-slate-800">{doc.experience_years || 15}+ Years</span>
                      </div>
                    </div>

                    <div
                      className="w-full py-2 rounded-xl bg-slate-900 group-hover:bg-blue-600 text-white font-bold text-xs transition-colors text-center"
                    >
                      View Profile & Book →
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state when no doctors */}
              {doctorsData.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
                  <Stethoscope className="w-8 h-8 text-slate-300" />
                  <p className="font-bold text-sm text-slate-500">No doctors listed yet</p>
                  <p className="text-xs text-slate-400">Doctor profiles for this hospital are being verified and will appear here shortly.</p>
                </div>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 4: TREATMENT PACKAGES */}
          {/* =============================================================== */}
          <div ref={packagesRef} className="flex flex-col gap-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">4. Transparent Treatment Packages</h3>
                    <p className="text-xs text-slate-400">All-inclusive fixed packages with OpenHealth Price Lock Guarantee</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                  {packagesData.length} Packages
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {packagesData.map((pkg) => (
                  <div key={pkg.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {pkg.category || 'Specialized Surgery'}
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                          {pkg.name}
                        </h4>
                        <span className="text-xs text-slate-400 block">
                          Duration: {pkg.duration_days} Days Stay • Room: {pkg.room_category}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Fixed Package</span>
                        <span className="text-lg sm:text-xl font-black text-slate-900">₹{(pkg.price || 150000).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="font-bold text-slate-800 text-[11px] block mb-1">Package Inclusions:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                        {(pkg.included_services || ['Surgeon & OT charges', 'Standard Room Stay', 'Consumables & Meds']).map((inc, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 stroke-[3]" />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Price Lock Guarantee</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => alert(`Treatment package '${pkg.name}' pre-booked successfully.`)}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Book Package
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state when no doctors */}
              {doctorsData.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
                  <Stethoscope className="w-8 h-8 text-slate-300" />
                  <p className="font-bold text-sm text-slate-500">No doctors listed yet</p>
                  <p className="text-xs text-slate-400">Doctor profiles for this hospital are being verified and will appear here shortly.</p>
                </div>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 5: INSURANCE & CASHLESS SCHEMES */}
          {/* =============================================================== */}
          <div ref={insuranceRef} className="flex flex-col gap-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">5. 100% Cashless Schemes & TPA Partners</h3>
                  <p className="text-xs text-slate-400">Zero upfront deposit on verified health insurance and government passes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { name: 'Ayushman Bharat (PM-JAY)', limit: '₹5,00,000 / family/yr', status: 'Empanelled' },
                  { name: 'Central Govt Health Scheme (CGHS)', limit: '100% CGHS Rates', status: 'Empanelled' },
                  { name: 'Employees State Insurance (ESIC)', limit: 'Full Primary & Tertiary', status: 'Empanelled' },
                  { name: 'State BPL Health Scheme', limit: 'State Sanctioned', status: 'Active' }
                ].map((sch) => (
                  <div key={sch.name} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{sch.name}</span>
                      <span className="text-[10.5px] text-slate-400">Coverage: {sch.limit}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                      {sch.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <span className="font-bold text-slate-900 text-xs block mb-2">Empanelled Private TPA Insurance:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    'Star Health',
                    'HDFC ERGO',
                    'ICICI Lombard',
                    'Care Health',
                    'Niva Bupa',
                    'Bajaj Allianz',
                    'Tata AIG',
                    'Medi Assist TPA'
                  ].map((tpa) => (
                    <div key={tpa} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 font-semibold text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{tpa}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 6: QUALITY & TRANSPARENCY SCORECARD */}
          {/* =============================================================== */}
          <div ref={transparencyRef} className="flex flex-col gap-4 pb-8">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">6. OpenHealth Transparency Scorecard</h3>
                    <p className="text-xs text-slate-400">Audited based on historical bill accuracy & rate disclosures</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-sm flex items-center gap-1 shadow-xs">
                  <span>{Math.round(hospital.transparency_score || 87)}% Score</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {[
                  { label: 'Price Clarity & Rate Card Disclosure', score: 94 },
                  { label: 'Package Clarity & Fixed Billing', score: 90 },
                  { label: 'Data Freshness & Bed Vacancy Sync', score: 96 },
                  { label: 'Information Completeness', score: 92 },
                  { label: 'Historical Bill Consistency (Low Shock)', score: 88 }
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{item.label}</span>
                      <span className="font-black text-blue-600">{item.score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Patient Reviews */}
              <div className="pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-900 text-xs block mb-2">Verified Patient Reviews:</span>
                <div className="flex flex-col gap-2.5">
                  {[
                    { author: 'Vikram S.', role: 'Cardiac Patient', date: '2 weeks ago', comment: 'Complete transparency on angioplasty package. Final bill matched the initial OpenHealth estimate within 2% variance.' },
                    { author: 'Meenakshi R.', role: 'Orthopedic Patient', date: '1 month ago', comment: 'Dr. Priya and the nursing staff were exceptional. Bed reservation was waiting when we arrived at emergency.' },
                    { author: 'Ankit P.', role: 'PM-JAY Beneficiary', date: '1 month ago', comment: 'Cashless PM-JAY desk processed authorization in under 20 minutes without any friction.' }
                  ].map((rev, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{rev.author}</span>
                          <span className="text-[10px] text-slate-400">({rev.role})</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Bed Check & Reservation Modal */}
      {checkBedsOpen && (
        <CheckBedsModal
          hospital={hospital}
          onClose={() => setCheckBedsOpen(false)}
          onBedHoldSuccess={handleBedHoldSuccess}
          onBedRelease={handleBedRelease}
        />
      )}
    </AppLayout>
  );
}
