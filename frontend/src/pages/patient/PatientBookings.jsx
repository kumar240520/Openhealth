import React, { useState, useEffect, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
import { 
  Calendar, 
  Clock, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowLeft, 
  Loader2, 
  Printer, 
  MoreVertical, 
  Copy, 
  Check, 
  Phone, 
  Headphones, 
  User, 
  Hourglass, 
  ChevronRight, 
  Info,
  XCircle,
  AlertTriangle,
  Timer,
  Navigation,
  Car,
  QrCode,
  ShieldCheck,
  Download,
  Lock,
  Stethoscope
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import { getDistanceToHospital, getEstimatedTravelTime } from '../../services/geolocationService';

export default function PatientBookings() {
  const { user, profile, userLocation } = useAuth();
  const [now, setNow] = useState(Date.now());
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [patientQrDataUrl, setPatientQrDataUrl] = useState('');

  // 1-second live clock for appointment countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [loading, setLoading] = useState(true);
  const [bookingsData, setBookingsData] = useState({
    all: [],
    doctorAppointments: [],
    bedReservations: [],
    totalCount: 0,
    allCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    cancelledCount: 0
  });

  // Filter Tabs: 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [activeTab, setActiveTab] = useState('all');

  // Selected booking for LEFT SIDE fixed detail panel (defaults to latest booking on page open)
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Cancellation & Support Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Fetch real patient bookings from backend
  const fetchBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await bookingService.getPatientBookings();
      setBookingsData(data || {
        all: [],
        doctorAppointments: [],
        bedReservations: [],
        totalCount: 0,
        allCount: 0,
        upcomingCount: 0,
        completedCount: 0,
        cancelledCount: 0
      });

      // Default the fixed left side panel to the latest booking on open
      if (data?.all && data.all.length > 0) {
        setSelectedBooking(prev => {
          if (prev && data.all.some(b => b.id === prev.id)) {
            return data.all.find(b => b.id === prev.id);
          }
          return data.all[0];
        });
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Handle Copy Booking ID to Clipboard
  const handleCopyId = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handle Reservation Cancellation
  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      setCancelling(true);
      if (selectedBooking.bookingType === 'bed_reservation') {
        await bookingService.cancelReservation(selectedBooking.id, cancelReason);
      } else {
        await bookingService.cancelAppointment(selectedBooking.id, cancelReason);
      }

      setCancelModalOpen(false);
      setCancelReason('');
      setOptionsMenuOpen(false);
      await fetchBookings();
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  // Generate patient UID QR code for verified printing
  useEffect(() => {
    const patientUid = profile?.id || user?.id || 'OPENHEALTH-PATIENT';
    QRCode.toDataURL(patientUid, {
      width: 260,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then(url => setPatientQrDataUrl(url))
      .catch(err => console.warn('QR Code generation error:', err));
  }, [profile, user]);

  // Precise status categorizers
  const isBookingActiveUpcoming = useCallback((b) => {
    if (!b) return false;
    const s = (b.status || '').toLowerCase();
    if (s === 'completed' || s === 'cancelled' || s === 'expired') return false;
    if (b.bookingType === 'bed_reservation' && s !== 'confirmed' && s !== 'admitted') {
      if (b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now()) return false;
    }
    return ['confirmed', 'held', 'pending', 'admitted'].includes(s);
  }, []);

  const isBookingCancelled = useCallback((b) => {
    if (!b) return false;
    const s = (b.status || '').toLowerCase();
    if (s === 'cancelled' || s === 'expired') return true;
    if (b.bookingType === 'bed_reservation' && s !== 'confirmed' && s !== 'admitted' && s !== 'completed') {
      if (b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now()) return true;
    }
    return false;
  }, []);

  // Filter items based on active tab
  const filteredBookings = useMemo(() => {
    const list = bookingsData.all || [];
    if (activeTab === 'upcoming') {
      return list.filter(isBookingActiveUpcoming);
    }
    if (activeTab === 'completed') {
      return list.filter(b => b.status === 'completed');
    }
    if (activeTab === 'cancelled') {
      return list.filter(isBookingCancelled);
    }
    return list;
  }, [bookingsData.all, activeTab, isBookingActiveUpcoming, isBookingCancelled]);

  // Update selected booking if tab switches and current selection is not in filtered list
  useEffect(() => {
    if (filteredBookings.length > 0) {
      if (!selectedBooking || !filteredBookings.some(b => b.id === selectedBooking.id)) {
        setSelectedBooking(filteredBookings[0]);
      }
    }
  }, [activeTab, filteredBookings]);

  // Tab Counts
  const counts = useMemo(() => {
    const all = bookingsData.all || [];
    return {
      all: all.length,
      upcoming: all.filter(isBookingActiveUpcoming).length,
      completed: all.filter(b => b.status === 'completed').length,
      cancelled: all.filter(isBookingCancelled).length
    };
  }, [bookingsData.all, isBookingActiveUpcoming, isBookingCancelled]);

  // Helper to dynamically calculate or resolve locked distance to hospital (Bed holds only)
  const getBookingProximity = (b) => {
    if (!b || b.bookingType === 'doctor_appointment') return null;

    // 1. If distance or drive time was locked at creation time, NEVER recompute or change it!
    if (b.distanceKm != null || b.driveTime) {
      return {
        distanceKm: b.distanceKm,
        travelTime: b.driveTime || (b.distanceKm ? `~${Math.round(b.distanceKm * 2.2)} mins` : '~9 mins'),
        travelMinutes: b.travelMinutes || (b.distanceKm ? Math.round(b.distanceKm * 2.2) : 9),
        isLocked: true,
        locationCaptured: b.locationCaptured
      };
    }

    // 2. If booking explicitly recorded that location was turned off at creation
    if (b.locationCaptured && b.locationCaptured.isLocationOn === false) {
      return {
        distanceKm: null,
        travelTime: null,
        travelMinutes: null,
        isLocked: true,
        locationOff: true
      };
    }

    // 3. Fallback only if never assigned at creation (legacy record)
    const hosp = {
      name: b.hospitalName,
      city: b.hospitalCity,
      latitude: b.hospitalLatitude,
      longitude: b.hospitalLongitude
    };
    const dist = getDistanceToHospital(hosp, userLocation);
    if (dist === null) return null;
    const travel = getEstimatedTravelTime(dist);
    return {
      distanceKm: dist,
      travelTime: travel.text,
      travelMinutes: travel.minutes,
      isLocked: false
    };
  };

  // Helper to compute live countdown dynamically driven by the booking's drive time (Bed holds only)
  const getCountdown = (b) => {
    if (!b || b.bookingType === 'doctor_appointment') return null;
    const s = (b.status || '').toLowerCase();
    if (s === 'cancelled') return { status: 'cancelled', label: 'Reservation Cancelled' };
    if (s === 'completed') return { status: 'completed', label: 'Reservation Completed' };
    if (s === 'confirmed' || s === 'admitted') {
      return { 
        status: 'confirmed', 
        isConfirmed: true, 
        label: s === 'admitted' ? 'Patient Admitted' : 'Bed Confirmed & Secured by Hospital' 
      };
    }

    // 1. Resolve distance and travel time from locked booking record
    const prox = getBookingProximity(b);
    const travelMins = prox?.travelMinutes || 9;
    const travelText = prox?.travelTime || (prox?.locationOff ? 'Standard Hold' : '~9 mins');

    // 2. Determine target arrival / expiry deadline driven by creation window
    // Once created, expiresAt is the immutable authority and NEVER shifts with location toggles!
    let target = null;
    if (b.expiresAt && new Date(b.expiresAt).getTime() > now) {
      target = new Date(b.expiresAt);
    } else if (b.createdAt) {
      const windowMinutes = b.holdMinutes || (travelMins + 20);
      const createdMs = new Date(b.createdAt).getTime();
      const totalWindowMs = windowMinutes * 60 * 1000;
      if (createdMs > 0 && (now - createdMs) < totalWindowMs) {
        target = new Date(createdMs + totalWindowMs);
      } else {
        target = new Date(now + windowMinutes * 60 * 1000);
      }
    }

    const diff = target ? target.getTime() - now : 0;
    if (diff <= 0) {
      return { status: 'passed', label: 'Arrival Window Concluded', isPassed: true, travelMins, travelText };
    }

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return {
      status: 'active',
      isPassed: false,
      days,
      hours,
      minutes,
      seconds,
      travelMins,
      travelText,
      formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`,
      isUrgent: hours === 0 && minutes < 15
    };
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    const s = (status || 'confirmed').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          Confirmed
        </span>
      );
    }
    if (s === 'pending' || s === 'held') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          Pending
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
          Completed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        Cancelled
      </span>
    );
  };

  return (
    <AppLayout>
      {/* ===================================================================== */}
      {/* FULL-HEIGHT SPLIT LAYOUT: SCROLLABLE LEFT COLUMN & FIXED RIGHT COLUMN */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 lg:h-[calc(100vh-4rem)] select-none">

        {/* =================================================================== */}
        {/* LEFT COLUMN: SCROLLABLE MY BOOKINGS HEADER, TABS & CARDS LIST       */}
        {/* =================================================================== */}
        <div className="flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          
          {/* 1. Breadcrumb & Page Header */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
              <span>Dashboard</span>
              <span>&gt;</span>
              <span className="text-slate-700 font-extrabold">Bookings</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
              My Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
              View and manage all your hospital bed reservations and doctor appointments
            </p>
          </div>

          {/* 2. Category Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'all', label: `All Bookings (${counts.all})` },
              { id: 'upcoming', label: `Upcoming (${counts.upcoming})` },
              { id: 'completed', label: `Completed (${counts.completed})` },
              { id: 'cancelled', label: `Cancelled (${counts.cancelled})` }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-3.5 text-xs sm:text-sm font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 3. Scrollable Cards List */}
          <div className="flex flex-col gap-4 pb-12">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs font-bold">Loading your reservations and appointments...</span>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">No bookings found</h3>
                <p className="text-xs text-slate-400 font-semibold max-w-sm">
                  {activeTab === 'all' 
                    ? 'You have not made any hospital bed reservations or doctor appointments yet.' 
                    : `No bookings found in the ${activeTab} tab.`}
                </p>
              </div>
            ) : (
              filteredBookings.map(b => {
                const isSelected = selectedBooking?.id === b.id;
                const cd = getCountdown(b);
                const prox = getBookingProximity(b);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white flex flex-col gap-4 shadow-2xs cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-xs' 
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Thumbnail + Title & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {b.bookingType === 'doctor_appointment' ? (
                          b.doctorImage ? (
                            <img 
                              src={b.doctorImage} 
                              alt={b.doctorName} 
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-blue-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                              <Stethoscope className="w-6 h-6" />
                            </div>
                          )
                        ) : (
                          <img 
                            src={b.hospitalImage || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80'} 
                            alt={b.hospitalName} 
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-slate-200/80 shadow-2xs"
                          />
                        )}

                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                            {b.bookingType === 'doctor_appointment' ? (b.doctorName || b.title) : b.hospitalName}
                          </h3>
                          <span className="text-xs text-slate-500 font-semibold block mt-0.5 truncate">
                            {b.bookingType === 'doctor_appointment' 
                              ? `${b.specialization || 'Specialist'} • ${b.hospitalName}`
                              : (b.title || 'Bed Reservation')}
                          </span>

                          {/* Type, Distance & Badges */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {b.bookingType === 'doctor_appointment' ? (
                              <>
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                                  <Stethoscope className="w-3 h-3 text-blue-600" />
                                  <span>{b.mode || 'In-Clinic OPD'}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                  <span>{b.payableAmount || '₹800'}</span>
                                  <span className="text-[9px] font-semibold text-emerald-600">CONFIRMED</span>
                                </span>
                              </>
                            ) : (
                              <>
                                {prox && (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                    <MapPin className="w-3 h-3 text-red-500" />
                                    <span>{prox.distanceKm !== null ? `${prox.distanceKm} km` : 'Location Off'}</span>
                                    {prox.travelTime && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span>{prox.travelTime}</span>
                                      </>
                                    )}
                                    {prox.isLocked && (
                                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded ml-0.5 flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5 text-emerald-600" />
                                        LOCKED
                                      </span>
                                    )}
                                  </span>
                                )}
                                {cd?.status === 'active' && (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                                    <Timer className="w-3 h-3 text-blue-600" />
                                    <span>{cd.formatted} remaining</span>
                                  </span>
                                )}
                                {cd?.status === 'confirmed' && (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Bed Confirmed</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {renderStatusBadge(b.status)}
                    </div>

                    {/* Metadata 4-Item Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-3 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
                      
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block leading-none">Date</span>
                          <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{b.date}</span>
                        </div>
                      </div>

                      {/* Time Slot */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block leading-none">Time Slot</span>
                          <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{b.time || '10:00 AM'}</span>
                        </div>
                      </div>

                      {/* Specialization */}
                      <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                        <Hourglass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block leading-none">
                            {b.bookingType === 'doctor_appointment' ? 'Specialty' : 'Specialization'}
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs mt-0.5 block truncate">
                            {b.specialization || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Chamber / Guests / Patient */}
                      <div className="flex items-center gap-2 col-span-2">
                        {b.bookingType === 'doctor_appointment' ? (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block leading-none">OPD Chamber / Link</span>
                              <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{b.chamber || 'Room 302, OPD Wing A'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block leading-none">Guests / Patient</span>
                              <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{b.guests || '1 Patient'}</span>
                            </div>
                          </>
                        )}
                      </div>

                    </div>

                    {/* Bottom Row: Booking ID + View Details Trigger */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 tracking-tight">
                        Booking ID: <span className="font-extrabold text-slate-600">{b.bookingCode || 'CC-ICU-290826-001'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg border font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <span>{isSelected ? 'Viewing' : 'View Details'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}

            {/* Bottom Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Can't find your booking? Check in Completed or Cancelled tabs.</span>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: FIXED & NON-SCROLLABLE / ANCHORED DETAILS BOX         */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] lg:h-full flex-shrink-0 bg-slate-50/70 border-l border-slate-200/90 p-4 sm:p-5 lg:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-start gap-4">
          
          {selectedBooking ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-5">
              
              {/* Header: Title, Active Badge, Print, More options */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {selectedBooking.bookingType === 'doctor_appointment' ? 'Doctor Appointment' : 'Booking Details'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 relative">
                  <button
                    type="button"
                    onClick={() => setPrintModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedBooking.bookingType === 'doctor_appointment' ? 'Print OPD Slip' : 'Print PDF Pass'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOptionsMenuOpen(prev => !prev)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {optionsMenuOpen && (
                    <div className="absolute right-0 top-10 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 flex flex-col text-xs font-bold text-slate-700">
                      {['confirmed', 'held', 'pending'].includes(selectedBooking.status) && (
                        <button
                          type="button"
                          onClick={() => {
                            setOptionsMenuOpen(false);
                            setCancelModalOpen(true);
                          }}
                          className="px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{selectedBooking.bookingType === 'doctor_appointment' ? 'Cancel Appointment' : 'Cancel Reservation'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setOptionsMenuOpen(false);
                          setSupportModalOpen(true);
                        }}
                        className="px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Headphones className="w-4 h-4 text-slate-400" />
                        <span>Contact Hospital</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {selectedBooking.status === 'confirmed' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-3 text-emerald-900">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black leading-tight">
                      {selectedBooking.bookingType === 'doctor_appointment' ? 'Appointment Confirmed' : 'Booking Confirmed'}
                    </h4>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      {selectedBooking.bookingType === 'doctor_appointment'
                        ? `Your consultation with ${selectedBooking.doctorName || 'the doctor'} is confirmed.`
                        : 'Your bed reservation is confirmed and active.'}
                    </p>
                  </div>
                </div>
              ) : selectedBooking.status === 'pending' || selectedBooking.status === 'held' ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3 text-amber-900">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black leading-tight">
                      {selectedBooking.bookingType === 'doctor_appointment' ? 'Appointment Pending' : 'Booking Pending Confirmation'}
                    </h4>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">
                      {selectedBooking.bookingType === 'doctor_appointment'
                        ? 'Your consultation request is awaiting chamber schedule confirmation.'
                        : 'Hospital bed allocation is being confirmed by the admissions desk.'}
                    </p>
                  </div>
                </div>
              ) : selectedBooking.status === 'completed' ? (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/90 flex items-start gap-3 text-blue-900">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black leading-tight">
                      {selectedBooking.bookingType === 'doctor_appointment' ? 'Consultation Fulfilled' : 'Booking Completed'}
                    </h4>
                    <p className="text-xs text-blue-700 font-semibold mt-0.5">
                      {selectedBooking.bookingType === 'doctor_appointment'
                        ? 'This doctor consultation was successfully conducted.'
                        : 'This bed reservation was fulfilled successfully.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/90 flex items-start gap-3 text-rose-900">
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black leading-tight">
                      {selectedBooking.bookingType === 'doctor_appointment' ? 'Appointment Cancelled' : 'Booking Cancelled'}
                    </h4>
                    <p className="text-xs text-rose-700 font-semibold mt-0.5">
                      {selectedBooking.bookingType === 'doctor_appointment'
                        ? 'This consultation appointment has been cancelled.'
                        : 'This reservation has been cancelled.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Countdown Timer & Proximity Calculations */}
              {(() => {
                const selectedCountdown = getCountdown(selectedBooking);
                const selectedProximity = getBookingProximity(selectedBooking);

                return (
                  <>
                    {/* Live Appointment Countdown Timer Card */}
                    {selectedCountdown && (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        selectedCountdown.status === 'confirmed'
                          ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border-emerald-200 text-emerald-950 shadow-2xs'
                          : selectedCountdown.status === 'active'
                          ? selectedCountdown.isUrgent
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm'
                            : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border-blue-200 text-blue-950 shadow-2xs'
                          : selectedCountdown.status === 'passed'
                          ? 'bg-slate-50 border-slate-200 text-slate-700'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                              selectedCountdown.status === 'confirmed'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : selectedCountdown.status === 'active' 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {selectedCountdown.status === 'confirmed' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Timer className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-black tracking-tight leading-none">
                                {selectedCountdown.status === 'confirmed' 
                                  ? 'Bed Reservation Confirmed' 
                                  : selectedCountdown.status === 'active' 
                                  ? 'Hospital Arrival & Bed Hold Window' 
                                  : 'Appointment Status'}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                {selectedCountdown.status === 'confirmed'
                                  ? 'The hospital has confirmed your reservation. Your bed is secured.'
                                  : selectedCountdown.status === 'active' 
                                  ? `Dynamically created from ~${selectedCountdown.travelText} drive time (${selectedProximity?.distanceKm || '3.3'} km)` 
                                  : selectedCountdown.label}
                              </span>
                            </div>
                          </div>

                          {selectedCountdown.status === 'confirmed' ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              OFFICIALLY CONFIRMED
                            </span>
                          ) : selectedCountdown.status === 'active' ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              LIVE ROUTE TIMER
                            </span>
                          ) : null}
                        </div>

                        {selectedCountdown.status === 'confirmed' ? (
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 bg-white/90 px-3 py-2 rounded-xl border border-emerald-100 mt-2 shadow-2xs">
                            <span className="flex items-center gap-1.5 text-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Hospital Priority Bed Guarantee Active</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-red-500" />
                              <span>{selectedProximity?.distanceKm !== null ? `${selectedProximity?.distanceKm} km away` : 'Hospital Notified'}</span>
                            </span>
                          </div>
                        ) : selectedCountdown.status === 'active' ? (
                          <>
                            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                              <div className="p-2 rounded-xl bg-white border border-blue-100/90 shadow-2xs">
                                <span className="text-base sm:text-lg font-black text-slate-900 leading-none block">
                                  {String(selectedCountdown.days).padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1 block">Days</span>
                              </div>
                              <div className="p-2 rounded-xl bg-white border border-blue-100/90 shadow-2xs">
                                <span className="text-base sm:text-lg font-black text-slate-900 leading-none block">
                                  {String(selectedCountdown.hours).padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1 block">Hours</span>
                              </div>
                              <div className="p-2 rounded-xl bg-white border border-blue-100/90 shadow-2xs">
                                <span className="text-base sm:text-lg font-black text-slate-900 leading-none block">
                                  {String(selectedCountdown.minutes).padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1 block">Mins</span>
                              </div>
                              <div className="p-2 rounded-xl bg-white border border-blue-100/90 shadow-2xs">
                                <span className="text-base sm:text-lg font-black text-blue-600 leading-none block">
                                  {String(selectedCountdown.seconds).padStart(2, '0')}
                                </span>
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1 block">Secs</span>
                              </div>
                            </div>

                            {/* Proximity Footer strip inside timer matching reference image */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 bg-white/90 px-3 py-2 rounded-xl border border-blue-100 mt-2.5 shadow-2xs">
                              <span className="flex items-center gap-1.5 text-blue-700">
                                <Car className="w-3.5 h-3.5" />
                                <span>Estimated Drive: {selectedCountdown.travelText}</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                <span>
                                  {selectedProximity?.distanceKm !== null ? `${selectedProximity.distanceKm} km away` : 'Location Off'}
                                </span>
                                <span className="text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  {selectedProximity?.isLocked ? (
                                    <>
                                      <Lock className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>Locked at Booking</span>
                                    </>
                                  ) : (
                                    userLocation?.source === 'gps' ? '📍 Live GPS' : `📍 ${userLocation?.cityName || 'Indore'}`
                                  )}
                                </span>
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs font-bold pt-1 text-slate-600">
                            {selectedCountdown.label}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Preview Card */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  {selectedBooking.bookingType === 'doctor_appointment' ? (
                    selectedBooking.doctorImage ? (
                      <img 
                        src={selectedBooking.doctorImage} 
                        alt={selectedBooking.doctorName} 
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-blue-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                        <Stethoscope className="w-7 h-7" />
                      </div>
                    )
                  ) : (
                    <img 
                      src={selectedBooking.hospitalImage || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80'} 
                      alt={selectedBooking.hospitalName} 
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                    />
                  )}

                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-slate-900 truncate">
                      {selectedBooking.bookingType === 'doctor_appointment' ? (selectedBooking.doctorName || selectedBooking.title) : selectedBooking.hospitalName}
                    </h4>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5 truncate">
                      {selectedBooking.bookingType === 'doctor_appointment'
                        ? `${selectedBooking.specialization || 'Consultant'} • ${selectedBooking.qualification || 'Senior Specialist'}`
                        : selectedBooking.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        Booking ID
                      </span>
                      <span className="font-extrabold text-xs text-slate-800">
                        {selectedBooking.bookingCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(selectedBooking.bookingCode)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Copy Booking ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {renderStatusBadge(selectedBooking.status)}
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">
                    Status: <span className="text-slate-700 capitalize">{selectedBooking.status}</span>
                  </span>
                </div>
              </div>

              {/* Booking Information 2-Column Grid */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                  {selectedBooking.bookingType === 'doctor_appointment' ? 'Consultation Information' : 'Booking Information'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-2 border-t border-slate-100 text-xs">
                  
                  {/* Date */}
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        {selectedBooking.bookingType === 'doctor_appointment' ? 'Appointment Date' : 'Date'}
                      </span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{selectedBooking.date}</span>
                    </div>
                  </div>

                  {/* Scheduled Slot */}
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        {selectedBooking.bookingType === 'doctor_appointment' ? 'Consultation Time' : 'Time Slot'}
                      </span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                        {selectedBooking.time || selectedBooking.timeSlot}
                      </span>
                    </div>
                  </div>

                  {/* Consultation Mode or Bed Proximity */}
                  {selectedBooking.bookingType === 'doctor_appointment' ? (
                    <div className="flex items-start gap-2.5">
                      <Stethoscope className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Consultation Mode</span>
                        <span className="font-extrabold text-blue-700 text-xs mt-0.5 block">
                          {selectedBooking.mode || 'In-Clinic OPD'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Distance From You</span>
                        <span className="font-extrabold text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                          <span>{getBookingProximity(selectedBooking)?.distanceKm ?? '3.5'} km</span>
                          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {userLocation?.source === 'gps' ? '📍 GPS' : `📍 ${userLocation?.cityName || 'Profile'}`}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Chamber Room or Estimated Drive Time */}
                  {selectedBooking.bookingType === 'doctor_appointment' ? (
                    <div className="flex items-start gap-2.5">
                      <Building2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">OPD Chamber / Link</span>
                        <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                          {selectedBooking.chamber || 'Room 302, OPD Wing A'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <Car className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Drive Time</span>
                        <span className="font-extrabold text-slate-800 text-xs mt-0.5 block text-blue-700">
                          ~{getBookingProximity(selectedBooking)?.travelTime ?? '15 mins'} drive
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Associated Hospital */}
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        {selectedBooking.bookingType === 'doctor_appointment' ? 'Hospital / Clinic' : 'Hospital'}
                      </span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                        {selectedBooking.hospitalName}, {selectedBooking.hospitalCity || 'Indore'}
                      </span>
                    </div>
                  </div>

                  {/* Hospital Contact Phone */}
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Hospital Helpdesk</span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                        {selectedBooking.hospitalPhone || '+91 731 249 9000'}
                      </span>
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="flex items-start gap-2.5">
                    <Copy className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Reference Booking ID</span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">{selectedBooking.bookingCode}</span>
                    </div>
                  </div>

                  {/* Specialization / Department */}
                  <div className="flex items-start gap-2.5">
                    <Hourglass className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        {selectedBooking.bookingType === 'doctor_appointment' ? 'Doctor Specialty' : 'Specialization / Department'}
                      </span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                        {selectedBooking.specialization || selectedBooking.department || 'Clinical Consultation'}
                      </span>
                    </div>
                  </div>

                  {/* Patient Name */}
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Patient Name</span>
                      <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                        {profile?.full_name || user?.user_metadata?.full_name || selectedBooking.guests || 'Patient'}
                      </span>
                    </div>
                  </div>

                  {/* Total Fee / Payable Amount */}
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        {selectedBooking.bookingType === 'doctor_appointment' ? 'Consultation Fee' : 'Total Payable Amount'}
                      </span>
                      <span className="font-black text-emerald-600 text-sm mt-0.5 block">
                        {selectedBooking.payableAmount || '₹800'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {selectedBooking.bookingType === 'doctor_appointment' 
                          ? 'Consultation fee confirmed online.' 
                          : (selectedBooking.paymentNote || 'Payment will be handled offline at the hospital.')}
                      </span>
                    </div>
                  </div>

                  {/* Reason for Visit / Patient Notes */}
                  {selectedBooking.patientNotes && (
                    <div className="flex items-start gap-2.5 sm:col-span-2 pt-2 border-t border-slate-100">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Reason for Visit / Symptoms</span>
                        <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
                          {selectedBooking.patientNotes}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Notice Box */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-xs text-slate-700 font-semibold">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {selectedBooking.bookingType === 'doctor_appointment'
                    ? 'Please arrive 15 minutes prior to your scheduled OPD consultation with your booking reference ID and any previous medical records.'
                    : 'Please carry a valid ID proof and this booking details while visiting the hospital.'}
                </span>
              </div>

              {/* Need Help Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">Need Help?</h5>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Our support team is here to help you with any booking queries.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 font-bold text-xs shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Contact Support</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200/90 text-center flex flex-col items-center justify-center gap-3">
              <Calendar className="w-8 h-8 text-slate-300" />
              <span className="text-xs font-bold text-slate-500">Select any booking from the left to view full details</span>
            </div>
          )}

        </div>

      </div>

      {/* =================================================================== */}
      {/* MODAL 1: CANCELLATION CONFIRMATION MODAL                            */}
      {/* =================================================================== */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Cancel Reservation?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to cancel your reservation for {selectedBooking?.hospitalName}?
              </p>
            </div>

            <div className="text-left text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-slate-400">Reason (Optional)</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, chosen alternate hospital..."
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: SUPPORT & HOSPITAL HELPLINE MODAL                          */}
      {/* =================================================================== */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Headphones className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Hospital Support Desk</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Connect with {selectedBooking?.hospitalName || 'the hospital admissions team'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs flex flex-col gap-2 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Admissions Desk:</span>
                <span className="font-extrabold text-slate-900">{selectedBooking?.hospitalPhone || '+91 731 249 9000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Toll-Free Patient Care:</span>
                <span className="font-extrabold text-blue-600">1800-419-7484</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-extrabold text-slate-700">{selectedBooking?.bookingCode || 'CC-ICU-290826-001'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: OFFICIAL PRINT PASS WITH PATIENT UID QR CODE               */}
      {/* =================================================================== */}
      {printModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 flex flex-col gap-6 relative">
            
            {/* Header / Modal Controls (hidden in print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">
                  {selectedBooking.bookingType === 'doctor_appointment' ? 'Doctor OPD Consultation Pass' : 'Hospital Admission & Booking Pass'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Pass Body */}
            <div id="printable-booking-slip" className="flex flex-col gap-5 bg-white text-slate-900 p-2 sm:p-4">
              
              {/* Top Hospital Branding */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedBooking.hospitalName}</h1>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedBooking.hospitalAddress}, {selectedBooking.hospitalCity}</p>
                  <p className="text-[11px] text-slate-500 font-semibold">Helpdesk: {selectedBooking.hospitalPhone} • Verified Empanelled Facility</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pass Code / Reference</span>
                  <span className="text-sm font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block mt-0.5">
                    {selectedBooking.bookingCode}
                  </span>
                </div>
              </div>

              {/* Patient Profile & Scannable UID QR Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="sm:col-span-2 flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Verified Patient Details</span>
                    <h2 className="text-lg font-black text-slate-900 mt-0.5">
                      {profile?.full_name || user?.email?.split('@')[0] || 'Registered Patient'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Ayushman Bharat Health Network (ABHA Linked)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Patient UID</span>
                      <span className="font-mono text-slate-800 font-bold break-all text-[11px]">{profile?.id || user?.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Blood Group</span>
                      <span className="text-rose-600 font-black">{profile?.blood_group || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Age / Gender</span>
                      <span className="text-slate-800">{profile?.age || '--'} Yrs / {profile?.gender || '--'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Contact Phone</span>
                      <span className="text-slate-800">{profile?.phone || user?.phone || '+91-9876543210'}</span>
                    </div>
                  </div>
                </div>

                {/* Patient UID QR Code Container */}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
                  {patientQrDataUrl ? (
                    <img
                      src={patientQrDataUrl}
                      alt="Patient UID QR Code"
                      className="w-28 h-28 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider mt-1.5 block">
                    Scan for Patient UID
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 truncate max-w-[120px]">
                    {profile?.id?.slice(0, 12) || user?.id?.slice(0, 12)}...
                  </span>
                </div>
              </div>

              {/* Service & Reservation Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {selectedBooking.bookingType === 'doctor_appointment' ? 'Doctor / Specialist' : 'Booking Type'}
                  </span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">
                    {selectedBooking.bookingType === 'doctor_appointment' ? selectedBooking.doctorName : selectedBooking.title}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {selectedBooking.bookingType === 'doctor_appointment' ? 'OPD Chamber / Room' : 'Department / Specialty'}
                  </span>
                  <span className="font-extrabold text-blue-600 mt-0.5 block">
                    {selectedBooking.bookingType === 'doctor_appointment'
                      ? (selectedBooking.chamber || 'Room 302, OPD Wing A')
                      : (selectedBooking.department || selectedBooking.specialization || 'Clinical Care')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Slot</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedBooking.date} • {selectedBooking.time}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {selectedBooking.bookingType === 'doctor_appointment' ? 'Consultation Fee' : 'Payment / Deposit'}
                  </span>
                  <span className="font-extrabold text-emerald-600 mt-0.5 block">{selectedBooking.payableAmount || 'Payable at Desk'}</span>
                </div>
              </div>

              {/* Admission / Consultation Instructions */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-950 flex flex-col gap-1">
                <span className="font-black uppercase tracking-wider text-[10px] text-amber-900">
                  {selectedBooking.bookingType === 'doctor_appointment' ? 'Doctor Consultation Instructions:' : 'Hospital Check-In Instructions:'}
                </span>
                {selectedBooking.bookingType === 'doctor_appointment' ? (
                  <>
                    <p>1. Present this digital/printed OPD slip at the reception upon arrival for instant queue token generation.</p>
                    <p>2. Please arrive 15 minutes before your scheduled slot. Keep past prescriptions and lab reports handy.</p>
                  </>
                ) : (
                  <>
                    <p>1. Present this printable pass and QR at the admission desk or triage upon arrival for automated check-in.</p>
                    <p>2. Keep your original Aadhaar Card or Ayushman Bharat PM-JAY card accessible for instant cashless verification.</p>
                  </>
                )}
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200 pt-3">
                <span>Issued by OpenHealth Digital Hospital Platform • India</span>
                <span>Generated: {new Date().toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Bottom Actions Bar (hidden in print) */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3 print:hidden">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF Pass</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Print-specific style block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-booking-slip, #printable-booking-slip * {
            visibility: visible !important;
          }
          #printable-booking-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: auto !important;
            background: white !important;
            z-index: 999999 !important;
            padding: 24px !important;
          }
        }
      `}} />

    </AppLayout>
  );
}
