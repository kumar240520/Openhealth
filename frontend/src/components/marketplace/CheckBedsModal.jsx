import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Bed, 
  Activity, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Calendar,
  Lock,
  RotateCcw,
  MapPin,
  Car
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDistanceToHospital, getEstimatedTravelTime } from '../../services/geolocationService';

export default function CheckBedsModal({ hospital, onClose, onBedHoldSuccess, onBedRelease }) {
  const { user, userLocation } = useAuth();
  const navigate = useNavigate();

  // Check if location is turned on at this moment
  const isLocationOn = Boolean(userLocation?.lat && userLocation?.lng && userLocation?.source !== 'off');

  // Dynamic proximity and drive time calculation (evaluated when location is active)
  const hospitalDistance = isLocationOn ? getDistanceToHospital(hospital, userLocation) : null;
  const travelInfo = hospitalDistance !== null ? getEstimatedTravelTime(hospitalDistance) : null;
  const travelMinutes = travelInfo?.minutes || null;
  
  // Dynamic time allotment: If location is ON, drive time + 20 mins arrival buffer (minimum 30 mins). If OFF, standard 30 mins.
  const dynamicHoldMinutes = isLocationOn && travelMinutes ? Math.max(30, travelMinutes + 20) : 30;

  const [bedsData, setBedsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [activeHold, setActiveHold] = useState(null);
  const [holdError, setHoldError] = useState('');
  const [holdExpired, setHoldExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(dynamicHoldMinutes * 60); // Initialized to dynamic time allotment
  const activeHoldRef = useRef(null);
  const selectedBedRef = useRef(null);
  activeHoldRef.current = activeHold;
  selectedBedRef.current = selectedBed;

  // Effective immutable values once activeHold is created
  const effectiveDistance = activeHold?.distanceKm !== undefined ? activeHold.distanceKm : hospitalDistance;
  const effectiveDriveText = activeHold?.driveTime !== undefined ? activeHold.driveTime : travelInfo?.text;
  const isHoldLocked = Boolean(activeHold?.isLocked);

  useEffect(() => {
    const fetchBeds = async () => {
      if (!hospital?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
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
          .eq('hospital_id', hospital.id);

        if (error) throw error;
        setBedsData(data || []);
      } catch (err) {
        console.error('Error fetching bed inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBeds();

    if (!hospital?.id) return;

    // Realtime channel for live sync with PostgreSQL while modal is open
    const channel = supabase
      .channel(`check_beds_modal_${hospital.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_beds',
          filter: `hospital_id=eq.${hospital.id}`
        },
        () => {
          console.log('[CheckBedsModal] Live bed change received from PostgreSQL');
          fetchBeds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospital]);

  // Handle 30-minute timer expiration (automatically release bed back to vacant inventory)
  const handleHoldExpired = async () => {
    const expiredHold = activeHoldRef.current;
    const expiredBed = selectedBedRef.current;
    if (!expiredHold?.holdId) return;

    // Immediately update modal state to show expired notification
    setReserveSuccess(false);
    setHoldExpired(true);
    setActiveHold(null);

    // 1. Release in PostgreSQL via atomic RPC (increments available_beds back to vacant)
    try {
      await supabase.rpc('release_bed_atomic', {
        p_reservation_id: expiredHold.holdId
      });
    } catch (rpcErr) {
      console.warn('Atomic release on hold expiry notice:', rpcErr);
    }

    // 2. Release via Express backend API
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(`http://localhost:5000/api/v1/hospitals/hold-bed/${expiredHold.holdId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (e) {}

    // 3. Restore vacant bed in local modal bedsData state
    if (expiredBed) {
      setBedsData(prev => prev.map(b => 
        (b.id === expiredBed.id || b.bed_type_id === (expiredBed.bed_type_id || expiredBed.bed_types?.id))
          ? { 
              ...b, 
              available_beds: (b.available_beds || 0) + 1, 
              reserved_beds: Math.max(0, (b.reserved_beds || 1) - 1) 
            }
          : b
      ));
    }

    // 4. Notify parent page (HospitalMarketplace or HospitalDetails) to restore vacant bed count
    if (onBedRelease) {
      onBedRelease(expiredBed, expiredHold);
    }
  };

  // Countdown timer for active hold
  useEffect(() => {
    if (!reserveSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleHoldExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reserveSuccess]);

  const formatCountdown = (seconds) => {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
    }
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleReserveHold = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedBed) return;

    try {
      setReserving(true);
      setHoldError('');

      // 1. Snapshot the exact location state at the moment of reservation
      const currentLocOn = Boolean(userLocation?.lat && userLocation?.lng && userLocation?.source !== 'off');
      const snapshotDistance = currentLocOn ? getDistanceToHospital(hospital, userLocation) : null;
      const snapshotTravel = snapshotDistance !== null ? getEstimatedTravelTime(snapshotDistance) : null;
      const snapshotMinutes = snapshotTravel?.minutes || null;
      const snapshotDriveText = snapshotTravel?.text || null;
      // If location is ON, take that location and create dynamic timer (drive time + 20 mins, min 30). If OFF, standard 30 mins.
      const holdMinutesToSet = currentLocOn && snapshotMinutes ? Math.max(30, snapshotMinutes + 20) : 30;
      const targetExpiresAt = new Date(Date.now() + holdMinutesToSet * 60 * 1000).toISOString();

      const locationSnapshot = currentLocOn ? {
        isLocationOn: true,
        lat: userLocation.lat,
        lng: userLocation.lng,
        cityName: userLocation.cityName || 'Indore',
        source: userLocation.source || 'gps',
        capturedAt: new Date().toISOString()
      } : {
        isLocationOn: false,
        capturedAt: new Date().toISOString()
      };

      let holdResult = null;
      const bedTypeId = selectedBed.bed_type_id || selectedBed.bed_types?.id;

      // 1. Direct PostgreSQL Atomic Hold RPC (bypasses client RLS via SECURITY DEFINER, atomically decrements available_beds in hospital_beds)
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('hold_bed_atomic', {
          p_user_or_patient_id: user.id,
          p_hospital_id: hospital.id,
          p_bed_type_id: bedTypeId,
          p_valid_minutes: holdMinutesToSet,
          p_distance_km: snapshotDistance,
          p_drive_time: snapshotDriveText,
          p_travel_minutes: snapshotMinutes,
          p_location_captured: locationSnapshot
        });

        if (!rpcErr && rpcRes && rpcRes.success) {
          holdResult = {
            holdId: rpcRes.reservation_id,
            bedType: selectedBed.bed_types?.name || 'Selected Bed',
            status: 'held',
            expiresAt: rpcRes.expires_at || targetExpiresAt,
            validMinutes: holdMinutesToSet,
            available_beds: rpcRes.available_beds,
            reserved_beds: rpcRes.reserved_beds,
            distanceKm: snapshotDistance,
            driveTime: snapshotDriveText,
            travelMinutes: snapshotMinutes,
            locationCaptured: locationSnapshot,
            isLocked: true
          };
        }
      } catch (rpcErr) {
        console.warn('Atomic RPC hold failed, trying Express backend API endpoint:', rpcErr);
      }

      // 2. Express Backend API Endpoint (Service Role admin decrement)
      if (!holdResult) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const apiRes = await fetch(`http://localhost:5000/api/v1/hospitals/${hospital.id}/hold-bed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            bedType: selectedBed.bed_types?.name || 'ICU',
            holdMinutes: holdMinutesToSet,
            driveTime: snapshotDriveText || '',
            distanceKm: snapshotDistance,
            travelMinutes: snapshotMinutes,
            locationCaptured: locationSnapshot
          })
        });
        const resJson = await apiRes.json();
        if (resJson.success && resJson.data) {
          holdResult = {
            ...resJson.data,
            distanceKm: snapshotDistance,
            driveTime: snapshotDriveText,
            travelMinutes: snapshotMinutes,
            locationCaptured: locationSnapshot,
            isLocked: true
          };
        } else {
          throw new Error(resJson.error?.message || 'Failed to place bed hold in database');
        }
      }

      // 3. Immediately decrement bed count in UI state
      setBedsData(prev => prev.map(b => 
        b.id === selectedBed.id 
          ? { 
              ...b, 
              available_beds: Math.max(0, (b.available_beds || 1) - 1), 
              reserved_beds: (b.reserved_beds || 0) + 1 
            }
          : b
      ));

      const allottedMinutes = holdResult?.validMinutes || holdMinutesToSet;
      setActiveHold(holdResult);
      setReserveSuccess(true);
      setTimeLeft(allottedMinutes * 60);

      // 4. Notify parent component to decrement bed count on page in real-time
      if (onBedHoldSuccess) {
        onBedHoldSuccess(selectedBed, holdResult);
      }
    } catch (err) {
      console.error('Reservation hold error:', err);
      setHoldError(err.message || 'Failed to place bed hold. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const handleReleaseHold = async () => {
    if (!activeHold?.holdId) return;
    try {
      setReserving(true);
      
      // 1. Try PostgreSQL Atomic Release RPC (restores bed to inventory in hospital_beds)
      try {
        await supabase.rpc('release_bed_atomic', {
          p_reservation_id: activeHold.holdId
        });
      } catch (rpcErr) {
        console.warn('Atomic release RPC notice:', rpcErr);
      }

      // 2. Try backend API
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        await fetch(`http://localhost:5000/api/v1/hospitals/hold-bed/${activeHold.holdId}/release`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
      } catch (e) {}

      // 3. Update local state
      if (selectedBed) {
        setBedsData(prev => prev.map(b => 
          b.id === selectedBed.id 
            ? { ...b, available_beds: b.available_beds + 1, reserved_beds: Math.max(0, (b.reserved_beds || 1) - 1) }
            : b
        ));
      }

      if (onBedRelease) {
        onBedRelease(selectedBed, activeHold);
      }

      setReserveSuccess(false);
      setActiveHold(null);
    } catch (err) {
      console.error('Failed to release hold:', err);
    } finally {
      setReserving(false);
    }
  };

  if (!hospital) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col justify-between custom-scrollbar"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Header */}
        <div className="p-6 border-b border-slate-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Live Bed Inventory
              </span>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                Live Verification
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {hospital.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified real-time capacity and bed vacancy tracking.
            </p>

            {/* Proximity & Estimated Drive Time Display (Matching reference design) */}
            <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2.5 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">Distance From You:</span>
                <span className="text-xs font-black text-slate-900">
                  {effectiveDistance !== null ? `${effectiveDistance} km` : 'Location Off'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                  {isHoldLocked ? (
                    <>
                      <Lock className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Locked at Booking</span>
                    </>
                  ) : isLocationOn ? (
                    userLocation?.source === 'gps' ? '📍 Live GPS' : `📍 ${userLocation?.cityName || 'Indore'}`
                  ) : (
                    '📍 Location Off'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase">Estimated Drive Time:</span>
                <span className="text-xs font-black text-slate-900">
                  {effectiveDriveText ? `~${effectiveDriveText} drive` : 'Standard 30m window'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Beds List or Confirmation Screen */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          
          {holdError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{holdError}</span>
            </div>
          )}

          {holdExpired && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-amber-800">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                  <span>Hold Window Expired</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHoldExpired(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                The reservation window has ended without admission booking or payment. This bed has been <strong>automatically returned to vacant inventory</strong> in the hospital registry and is now available for other patients.
              </p>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span>Fetching verified live bed data...</span>
            </div>
          ) : reserveSuccess ? (
            <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              
              <div>
                <h4 className="text-lg font-black text-slate-900">Instant Bed Hold Active!</h4>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  1 bed in <strong className="text-slate-800">{activeHold?.bedType || selectedBed?.bed_types?.name}</strong> has been locked in the live hospital registry for you.
                </p>
              </div>

              {/* Dynamic Time Allotment Breakdown Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200 text-blue-950 flex flex-col gap-2.5 max-w-md w-full shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-blue-700 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    {activeHold?.locationCaptured?.isLocationOn ? 'Dynamic Route Time Allotment' : 'Standard 30-Minute Hold'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs flex items-center gap-1">
                    <Lock className="w-3 h-3 text-blue-200" />
                    {activeHold?.validMinutes || dynamicHoldMinutes} Mins Locked
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-1.5 border-t border-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase leading-tight">Drive Time</span>
                      <span className="text-xs font-black text-slate-800">
                        {activeHold?.driveTime ? `~${activeHold.driveTime}` : 'Standard Hold'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase leading-tight">Arrival Buffer</span>
                      <span className="text-xs font-black text-slate-800">
                        {activeHold?.locationCaptured?.isLocationOn ? '+20 mins grace' : '30 mins buffer'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-500 font-semibold border-t border-blue-100/70 pt-1.5 flex items-center justify-between">
                  <span>
                    {activeHold?.distanceKm != null 
                      ? `Distance: ${activeHold.distanceKm} km away` 
                      : 'Location was off at hold creation'}
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Booking Details Locked
                  </span>
                </div>
              </div>

              {/* Countdown Badge with matching allotted time */}
              <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-base sm:text-lg shadow-xs">
                <Clock className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                <span>Time Remaining: {formatCountdown(timeLeft)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 max-w-md text-left">
                <strong>Hold ID:</strong> <code className="text-blue-600">{activeHold?.holdId?.slice(0, 16)}...</code><br />
                Present this hold or your registered phone number at the hospital admission desk.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full max-w-md pt-2">
                <button
                  type="button"
                  onClick={handleReleaseHold}
                  disabled={reserving}
                  className="flex-1 py-2.5 rounded-2xl bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-red-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Release Bed</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/app/bookings');
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  View in My Bookings
                </button>
              </div>
            </div>
          ) : bedsData.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
              No live bed inventory found for this hospital.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bedsData.map((bed) => {
                const bedName = bed.bed_types?.name || 'General Bed';
                const isSelected = selectedBed?.id === bed.id;
                const available = bed.available_beds || 0;
                const isAvailable = available > 0;

                return (
                  <div
                    key={bed.id}
                    onClick={() => isAvailable && setSelectedBed(bed)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected 
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20' 
                        : isAvailable 
                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        bedName.includes('ICU') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {bedName.includes('ICU') ? <Activity className="w-5 h-5" /> : <Bed className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="font-black text-sm text-slate-900 block">{bedName}</span>
                        <span className="text-[11px] text-slate-400">{bed.bed_types?.description || 'Standard medical care unit'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            ₹{Number(bed.price_per_day || 1500).toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-sans font-normal">/day</span>
                          </span>
                          <span className={`font-black text-xs ${isAvailable ? 'text-emerald-700' : 'text-red-500'}`}>
                            {available} Available
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Total {bed.total_beds} • Reserved {bed.reserved_beds || 0}
                          </span>
                        </div>
                      </div>

                      {isAvailable ? (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                          Full
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guarantee Safety Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-[11px] text-slate-500">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Bed availability is decremented in real-time under OpenHealth Rule 17 invariants upon reservation hold.</span>
          </div>

        </div>

        {/* 3. Footer Action */}
        {!reserveSuccess && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Selected</span>
              <span className="font-bold text-xs text-slate-800">
                {selectedBed ? `${selectedBed.bed_types?.name} (₹${Number(selectedBed.price_per_day || 1500).toLocaleString('en-IN')}/day)` : 'Choose a bed category'}
              </span>
            </div>

            <button
              type="button"
              disabled={!selectedBed || reserving || (selectedBed.available_beds || 0) <= 0}
              onClick={handleReserveHold}
              className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reserving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Placing Bed Hold...</span>
                </>
              ) : (
                <>
                  <span>Instant Bed Hold</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
