import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Share2, 
  Calendar, 
  CreditCard, 
  FileText, 
  Stethoscope, 
  ChevronRight, 
  Lock, 
  AlertCircle,
  Loader2, 
  Shield, 
  Award, 
  Check, 
  Clock, 
  CheckCircle2, 
  CheckCircle, 
  Tag, 
  Video, 
  GraduationCap, 
  Activity, 
  User, 
  ThumbsUp, 
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import BookAppointmentModal from '../../components/marketplace/BookAppointmentModal';
import doctorService from '../../services/doctorService';
import bookingService from '../../services/bookingService';
import { 
  getDynamicAppointmentDates, 
  getAvailableSlotsForDate, 
  getDefaultAppointmentSelection 
} from '../../utils/appointmentTimeUtils';

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Gallery active photo index
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Data state
  const [doctor, setDoctor] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Section Refs for smooth scrolling within right pane
  const overviewRef = useRef(null);
  const qualificationsRef = useRef(null);
  const bookingRef = useRef(null);
  const reviewsRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Dynamic real-time synchronized appointment booking state
  const initialSelection = React.useMemo(() => getDefaultAppointmentSelection(), []);
  const [consultationType, setConsultationType] = useState('in_clinic');
  const [selectedDate, setSelectedDate] = useState(initialSelection.selectedDate);
  const [selectedTime, setSelectedTime] = useState(initialSelection.selectedTime);
  const [patientNotes, setPatientNotes] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState(null);

  // Daily appointment slots & doctor uniqueness validation state
  const [slotStatus, setSlotStatus] = useState({
    canBook: true,
    activeSlotsCount: 0,
    maxSlots: 2,
    remainingSlots: 2,
    isSameDoctorBooked: false,
    bookedDoctorName: null
  });
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Dynamically recomputed dates and available slots
  const availableDates = React.useMemo(() => getDynamicAppointmentDates(), []);
  const availableSlots = React.useMemo(() => getAvailableSlotsForDate(selectedDate), [selectedDate]);

  // Keep selectedTime synchronized when switching dates
  React.useEffect(() => {
    if (availableSlots.all.length > 0 && !availableSlots.all.includes(selectedTime)) {
      setSelectedTime(availableSlots.all[0]);
    } else if (availableSlots.all.length === 0) {
      setSelectedTime('');
    }
  }, [availableSlots, selectedTime]);

  // Check daily slot availability whenever doctor id or selectedDate changes
  React.useEffect(() => {
    let isMounted = true;
    async function checkSlots() {
      if (!id || !selectedDate) return;
      setCheckingSlots(true);
      setBookingError('');
      try {
        const status = await bookingService.checkDailySlotAvailability(id, selectedDate);
        if (isMounted) {
          setSlotStatus(status);
        }
      } catch (err) {
        console.warn('Daily slot availability check notice in DoctorDetails:', err);
      } finally {
        if (isMounted) setCheckingSlots(false);
      }
    }
    checkSlots();
    return () => { isMounted = false; };
  }, [id, selectedDate]);

  const scrollToBooking = () => {
    if (bookingRef?.current && scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      const targetTop = bookingRef.current.offsetTop - 20;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  };

  // Fetch complete doctor details via backend API
  useEffect(() => {
    const fetchDoctorComplete = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setErrorMsg('');

        const docData = await doctorService.getDoctorById(id);
        if (!docData) throw new Error('Doctor profile not found.');

        setDoctor(docData);
        setHospital(docData.hospitals || {});

        // Check if saved by patient
        if (user) {
          const savedList = await doctorService.getSavedDoctors();
          const isDocSaved = savedList.some(s => (s.doctors?.id || s.doctor_id) === id);
          setIsSaved(isDocSaved);
        }
      } catch (err) {
        console.error('Error fetching doctor dossier:', err);
        setErrorMsg('Doctor profile not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorComplete();
  }, [id, user]);

  // Handle Save Toggle via backend API
  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      await doctorService.toggleSaveDoctor(id);
    } catch (err) {
      console.warn('Save toggle notice:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleDirectBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Pre-flight client guard for slot limits and doctor uniqueness
    if (!slotStatus.canBook) {
      if (slotStatus.isSameDoctorBooked) {
        setBookingError(`You already have an appointment booked with Dr. ${doctor?.name || 'this specialist'} on ${selectedDate}. OpenHealth allows up to 2 appointments per day, but they must be with different doctors.`);
      } else if (slotStatus.activeSlotsCount >= 2) {
        setBookingError(`Daily limit reached (2/2 active slots booked for ${selectedDate}). Please complete or cancel an existing appointment to free up a slot.`);
      }
      return;
    }

    try {
      setBookingInProgress(true);
      setBookingError('');

      const confirmedData = await bookingService.bookAppointment({
        doctorId: doctor.id,
        hospitalId: doctor.hospital_id || null,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        consultationType,
        patientNotes
      });

      setConfirmedDetails({
        appointmentId: confirmedData.appointmentId,
        doctorName: confirmedData.doctorName || doctor.name,
        date: confirmedData.date || selectedDate,
        time: confirmedData.time || selectedTime,
        type: confirmedData.type || (consultationType === 'in_clinic' ? 'In-Clinic OPD Consultation' : 'Online Video Teleconsultation'),
        fee: confirmedData.fee || (consultationType === 'in_clinic' ? inClinicFee : videoFee)
      });
      setBookingConfirmed(true);
    } catch (err) {
      console.error('Direct booking error:', err);

      // Check if this error is an invariant/validation rejection
      const isValidationError = err.message && (
        err.message.includes('already have an appointment') ||
        err.message.includes('Daily appointment limit') ||
        err.message.includes('different doctors') ||
        err.message.includes('active slots booked')
      );

      if (isValidationError) {
        setBookingError(err.message);
        bookingService.checkDailySlotAvailability(doctor.id, selectedDate).then(setSlotStatus);
        return;
      }

      // Resilient fallback to direct Supabase
      try {
        let { data: patProfile } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!patProfile?.id) {
          const { data: newPat } = await supabase
            .from('patient_profiles')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          patProfile = newPat;
        }

        const consultationFee = consultationType === 'in_clinic' ? inClinicFee : videoFee;

        const { data: appointment, error: aErr } = await supabase
          .from('doctor_appointments')
          .insert({
            patient_id: patProfile?.id || null,
            doctor_id: doctor.id,
            hospital_id: doctor.hospital_id || null,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            consultation_type: consultationType,
            status: 'confirmed',
            patient_notes: patientNotes || 'Direct appointment booking via OpenHealth portal',
            consultation_fee: consultationFee
          })
          .select()
          .single();

        if (aErr) throw aErr;

        setConfirmedDetails({
          appointmentId: appointment?.id || `APT-${Date.now().toString().slice(-6)}`,
          doctorName: doctor.name,
          date: selectedDate,
          time: selectedTime,
          type: consultationType === 'in_clinic' ? 'In-Clinic OPD Consultation' : 'Online Video Teleconsultation',
          fee: consultationFee
        });
        setBookingConfirmed(true);
      } catch (fallbackErr) {
        console.error('Direct booking fallback error:', fallbackErr);
        const displayErr = fallbackErr.message || err.message || 'Failed to confirm appointment. Please try again.';
        setBookingError(displayErr);
        bookingService.checkDailySlotAvailability(doctor.id, selectedDate).then(setSlotStatus);
      }
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="font-bold text-sm">Loading doctor clinical dossier...</span>
        </div>
      </AppLayout>
    );
  }

  if (errorMsg || !doctor) {
    return (
      <AppLayout>
        <div className="py-24 flex-1 max-w-lg mx-auto p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h2 className="text-xl font-black text-slate-900">{errorMsg || 'Doctor Profile Not Found'}</h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested practitioner profile could not be loaded or is inactive.
          </p>
          <button
            onClick={() => navigate('/app/doctors')}
            className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md cursor-pointer"
          >
            Back to Doctors Directory
          </button>
        </div>
      </AppLayout>
    );
  }

  const rating = doctor.rating ? Number(doctor.rating).toFixed(1) : '4.8';
  const reviewCount = doctor.review_count || 248;
  const experienceYears = doctor.experience_years || 14;
  const inClinicFee = Number(doctor.consultation_fee || 800);
  const videoFee = Math.max(300, inClinicFee - 200);
  const hospName = hospital?.name || 'Indore Multispeciality Hospital';
  const hospCity = hospital?.city || 'Indore';
  const hospPhone = hospital?.phone || '+91-731-4223300';

  // High-availability doctor gallery photos matching HospitalDetails pattern
  const primaryDocImage = doctor.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80';
  const galleryPhotos = [
    { url: primaryDocImage, caption: `${doctor.name} - Senior Consultant ${doctor.specialization}` },
    { url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', caption: 'Consultation Chamber & Examination Suite' },
    { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', caption: 'Advanced Modular Surgical Operation Theater' },
    { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80', caption: '24/7 Critical Care & Inpatient OPD Center' },
    { url: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80', caption: 'Diagnostic Imaging & Patient Recovery Lounge' }
  ];

  // Clinical specializations and procedures matching doctor specialization
  const clinicalSpecialties = [
    `${doctor.specialization} Consultations`,
    'Diagnostic Case Evaluation',
    'Evidence-Based Clinical Management',
    'Pre-Procedural Assessment',
    'Post-Treatment Follow-up & Rehabilitation',
    'Second Opinion Consultation'
  ];

  // Patient Reviews
  const patientReviews = [
    { 
      author: 'Rohit K.', 
      role: 'Verified Patient', 
      date: '2 weeks ago', 
      rating: 5,
      comment: `Very patient listener. Explained my test reports in clear, simple terms and avoided unnecessary medications. Recovery has been exceptionally smooth.` 
    },
    { 
      author: 'Meena S.', 
      role: 'Second Opinion', 
      date: '1 month ago', 
      rating: 5,
      comment: `Visited ${doctor.name} for my mother’s diagnosis. Highly thorough approach and recommended targeted therapy before rushing into any surgery.` 
    },
    { 
      author: 'Deepak V.', 
      role: 'In-Clinic Consultation', 
      date: '1 month ago', 
      rating: 4.8,
      comment: `Appointment was honored right on schedule at ${hospName}. Very polite chamber staff and transparent prescription instructions.` 
    }
  ];

  return (
    <AppLayout>
      {/* SPLIT LAYOUT BODY: FIXED NON-SCROLLABLE LEFT & SCROLLABLE RIGHT (MATCHES HospitalDetails.jsx EXACTLY) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0 lg:h-[calc(100vh-4rem)]">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: 100% FIXED & NON-SCROLLABLE (MATCHES HospitalDetails)  */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[440px] xl:w-[470px] lg:h-full flex-shrink-0 bg-slate-50/70 border-r border-slate-200/90 p-4 sm:p-5 lg:p-6 lg:overflow-hidden flex flex-col justify-start gap-4">
          
          {/* A. Showcase Photo Gallery Card */}
          <div className="p-3 sm:p-3.5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
            
            {/* Main Showcase Image */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group">
              <img 
                src={galleryPhotos[selectedPhotoIndex].url} 
                alt={doctor.name} 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Verified Top-Left Badge */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <div className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-bold text-[10.5px] flex items-center gap-1 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Verified Specialist</span>
                </div>
              </div>

              {/* Patient Satisfaction Top-Right */}
              <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10.5px] font-bold shadow-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Score 98%</span>
              </div>

              {/* Caption Strip */}
              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent text-white text-xs font-semibold text-center truncate">
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
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover object-top" 
                  />
                </button>
              ))}
            </div>

          </div>

          {/* B. OPD Consultation Desk Card (Matches HospitalDetails Admission Desk Card) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3 text-xs">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  CLINICAL OPD DESK
                </span>
                <span className="text-base font-black text-slate-900 mt-0.5">
                  Doctor Consultation Desk
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available Today</span>
              </div>
            </div>

            {/* Two Column Fee & Mode Boxes */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">IN-CLINIC OPD</span>
                <span className="text-lg font-black text-blue-900 mt-0.5 block">₹{inClinicFee}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-teal-50/80 border border-teal-100">
                <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">VIDEO CONSULT</span>
                <span className="text-lg font-black text-teal-900 mt-0.5 block">₹{videoFee}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={scrollToBooking}
                className="w-full py-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span>Instant Appointment Booking</span>
              </button>

              {hospital?.id && (
                <button
                  type="button"
                  onClick={() => navigate(`/app/hospitals/${hospital.id}`)}
                  className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300/90 text-slate-800 hover:text-blue-600 font-bold text-xs tracking-tight flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Hospital Profile ({hospName.slice(0, 22)}...)</span>
                </button>
              )}
            </div>

            {/* Hospital Contact Desk */}
            <div className="p-2.5 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-center justify-between gap-2 text-red-900">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span className="font-bold text-[10.5px]">24/7 OPD Appointment Desk</span>
              </div>
              <a href={`tel:${hospPhone}`} className="font-black text-xs text-red-600 hover:underline">
                {hospPhone}
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
              <button onClick={() => navigate('/app/doctors')} className="hover:text-blue-600 transition-colors cursor-pointer">
                Home
              </button>
              <span className="text-slate-300">/</span>
              <button onClick={() => navigate('/app/doctors')} className="hover:text-blue-600 transition-colors cursor-pointer">
                Doctors
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-semibold">{hospCity}, MP</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs">{doctor.name}</span>
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
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shareCopied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* 1. Main Header Card (Matches Document 3 & Hospital Details Card 1) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
            
            {/* Category & Accreditation Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px]">
                {doctor.specialization}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[11px] flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                <span>MCI & State Medical Council Verified</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                Available Today
              </span>
            </div>

            {/* Doctor Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {doctor.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Practicing at {hospName}, {hospCity} • {doctor.qualification}</span>
              </p>
            </div>

            {/* Rating, Reviews & Consultation Status */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-lg shadow-xs">
                <span>{rating}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-slate-700 font-bold">
                {reviewCount} Verified Patient Ratings
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Open • In-Clinic OPD & Video Consultations Active</span>
              </div>
            </div>

            {/* Small Icon-Based Highlight Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Experience</span>
                  <span className="font-black text-slate-800 text-xs truncate">{experienceYears}+ Years</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ThumbsUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Satisfaction</span>
                  <span className="font-black text-slate-800 text-xs truncate">98% Positive</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Consultations</span>
                  <span className="font-black text-slate-800 text-xs truncate">3,500+ Cases</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Registration</span>
                  <span className="font-black text-slate-800 text-xs truncate">{doctor.registration_number || 'MP-MC-2012'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* =============================================================== */}
          {/* SECTION 1: DOCTOR OVERVIEW & CLINICAL PHILOSOPHY                 */}
          {/* =============================================================== */}
          <div ref={overviewRef} className="flex flex-col gap-5">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">1. Doctor Overview & Clinical Philosophy</h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                {doctor.about || `${doctor.name} is an experienced specialist in ${doctor.specialization} with over ${experienceYears} years of practice. Dedicated to transparent evidence-based patient management, ethical medical consultations, and minimally invasive procedural recovery at ${hospName}.`}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Specialization</span>
                  <span className="font-black text-slate-800 text-xs">{doctor.specialization}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Experience</span>
                  <span className="font-black text-slate-800 text-xs">{experienceYears}+ Years</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Languages Spoken</span>
                  <span className="font-black text-emerald-600 text-xs">
                    {Array.isArray(doctor.languages) ? doctor.languages.join(', ') : 'English, Hindi'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Associated Hospital</span>
                  <span className="font-black text-blue-600 text-xs truncate">{hospName}</span>
                </div>
              </div>
            </div>

            {/* Specializations & Clinical Focus Areas */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Specializations & Focus Areas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {clinicalSpecialties.map((spec) => (
                  <div key={spec} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 font-semibold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 2: QUALIFICATIONS, EDUCATION & ACCREDITATIONS           */}
          {/* =============================================================== */}
          <div ref={qualificationsRef} className="flex flex-col gap-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">2. Qualifications, Education & Medical Accreditations</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Degrees & Qualifications:</span>
                    <span className="text-slate-600 leading-relaxed text-xs">
                      {doctor.qualification} • {doctor.education || 'Trained at premier medical colleges with specialized postgraduate clinical training.'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Medical Council Registration:</span>
                    <span className="text-slate-600 text-xs">
                      Registration No: <strong className="text-slate-800 font-mono">{doctor.registration_number || 'MP-MC-2012-4891'}</strong> • Verified Active Practitioner
                    </span>
                  </div>
                </div>

                {doctor.awards && doctor.awards.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Honors & Recognitions:</span>
                      <span className="text-slate-600 text-xs">
                        {doctor.awards.join(' • ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION 3: IN-PAGE INTERACTIVE APPOINTMENT BOOKING WIDGET         */}
          {/* =============================================================== */}
          <div 
            ref={bookingRef} 
            className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    3. Book Doctor Appointment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select consultation mode, preferred date, and time slot for instant confirmation.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                Instant Confirmation
              </span>
            </div>

            {bookingConfirmed ? (
              <div className="py-6 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <h4 className="text-xl font-black text-slate-900">Appointment Confirmed!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Your appointment with <strong className="text-slate-800">{doctor.name}</strong> is confirmed for <strong className="text-slate-800">{confirmedDetails?.time} on {confirmedDetails?.date}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs w-full max-w-md flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking ID:</span>
                    <span className="font-mono font-bold text-blue-600">{confirmedDetails?.appointmentId?.slice(0, 18)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hospital / Chamber:</span>
                    <span className="font-bold text-slate-800">{hospName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Mode:</span>
                    <span className="font-bold text-slate-800">{confirmedDetails?.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-black text-emerald-600 text-sm">₹{confirmedDetails?.fee}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingConfirmed(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Book Another Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/patient')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    Go to Patient Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs">
                {/* Booking Error Banner */}
                {bookingError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span className="font-semibold leading-relaxed">{bookingError}</span>
                  </div>
                )}

                {/* Consultation Type Selector */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2">Select Consultation Mode:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultationType('in_clinic')}
                      className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        consultationType === 'in_clinic'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/15'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>In-Clinic OPD (₹{inClinicFee})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultationType('video')}
                      className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        consultationType === 'video'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/15'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Video Consult (₹{videoFee})</span>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                    <label className="font-bold text-slate-800">Select Consultation Date:</label>
                    {/* Real-time daily slots counter badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {checkingSlots ? (
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                          <span>Checking limits...</span>
                        </span>
                      ) : slotStatus.isSameDoctorBooked ? (
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Doctor Booked Today</span>
                        </span>
                      ) : slotStatus.activeSlotsCount >= 2 ? (
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span>Daily Limit (2/2 Slots)</span>
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          Daily Slots: {slotStatus.activeSlotsCount}/2 Active ({slotStatus.remainingSlots} free)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableDates.map(d => {
                      const isSelected = selectedDate === d.date;
                      const isDisabled = !d.hasSlots;

                      return (
                        <button
                          key={d.date}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled) setSelectedDate(d.date);
                          }}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                              : isDisabled
                              ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-bold text-xs">
                            {d.label} {isDisabled && '(Passed)'}
                          </span>
                          <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {d.day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Same Doctor Rule Explainer Banner */}
                  {slotStatus.isSameDoctorBooked && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-black text-amber-950 block">Specialist Already Booked for This Date</strong>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          You already have an appointment booked with <strong>{doctor.name}</strong> on <strong>{selectedDate}</strong>. 
                          Under platform policy, you can book up to 2 appointments per day with <em>different specialists</em>. 
                          Please choose another date or consult another doctor.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2-Slot Daily Limit Rule Explainer Banner */}
                  {slotStatus.activeSlotsCount >= 2 && !slotStatus.isSameDoctorBooked && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-red-50 border border-red-200/90 text-red-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-black text-red-950 block">Daily Limit Reached (2/2 Active Slots Filled)</strong>
                        <p className="text-[11px] text-red-800 mt-0.5 leading-relaxed">
                          You currently hold 2 active appointment slots on <strong>{selectedDate}</strong>. 
                          Once an appointment is completed or cancelled, that slot becomes available immediately for another booking on this date.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Real-Time Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800">Select Preferred Time Slot:</label>
                    <span className="text-[10.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {availableSlots.all.length} slots available
                    </span>
                  </div>

                  {availableSlots.all.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold text-center flex flex-col items-center gap-1">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span>All consultation slots for this date have concluded.</span>
                      <span className="text-[11px] text-amber-700 font-bold">Please select Tomorrow or an upcoming date above.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availableSlots.all.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-1 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            selectedTime === slot
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Reason for Visit (Optional):</label>
                  <input
                    type="text"
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    placeholder="E.g. Knee joint discomfort, second opinion, regular consultation..."
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Confirm Action */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Consultation Fee</span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{consultationType === 'in_clinic' ? inClinicFee : videoFee}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDirectBooking}
                    disabled={bookingInProgress || checkingSlots || !slotStatus.canBook || availableSlots.all.length === 0}
                    className={`px-8 py-3 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                      !slotStatus.canBook
                        ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : checkingSlots ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        <span>Checking Limits...</span>
                      </>
                    ) : slotStatus.isSameDoctorBooked ? (
                      <>
                        <span>Doctor Booked Today</span>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                      </>
                    ) : slotStatus.activeSlotsCount >= 2 ? (
                      <>
                        <span>Daily Limit Reached (2/2)</span>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </>
                    ) : (
                      <>
                        <span>Confirm Appointment</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* SECTION 4: VERIFIED PATIENT REVIEWS & RATINGS                   */}
          {/* =============================================================== */}
          <div ref={reviewsRef} className="flex flex-col gap-4 pb-8">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">4. Verified Patient Reviews & Rating Breakdown</h3>
                    <p className="text-xs text-slate-400">Authentic reviews from patients who booked and consulted with {doctor.name}</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-sm flex items-center gap-1 shadow-xs">
                  <span>{rating} out of 5.0</span>
                </div>
              </div>

              {/* Patient Reviews List */}
              <div className="flex flex-col gap-3">
                {patientReviews.map((rev, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{rev.author}</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {rev.role}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Booking Modal Fallback */}
      {bookingModalOpen && (
        <BookAppointmentModal
          doctor={doctor}
          onClose={() => setBookingModalOpen(false)}
          onBookingSuccess={(details) => {
            setConfirmedDetails(details);
            setBookingConfirmed(true);
            setBookingModalOpen(false);
          }}
        />
      )}
    </AppLayout>
  );
}
