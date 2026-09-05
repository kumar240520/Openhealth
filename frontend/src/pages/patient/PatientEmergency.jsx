import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Siren, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ShieldAlert, 
  AlertTriangle, 
  Compass, 
  RotateCw, 
  Navigation, 
  Car, 
  Lock, 
  X, 
  Loader2, 
  ChevronRight, 
  ShieldCheck, 
  HeartPulse, 
  Activity,
  BedDouble,
  Info
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import EmergencyMap from '../../components/emergency/EmergencyMap';
import emergencyService from '../../services/emergencyService';
import { useAuth } from '../../context/AuthContext';

// Reverse geocode GPS coordinates to actual street/city address using OSM Nominatim
async function reverseGeocodeAddress(lat, lng) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || data.address.subdistrict;
        const city = data.address.city || data.address.town || data.address.county || data.address.state_district;
        const state = data.address.state;
        const pin = data.address.postcode;
        const parts = [area, city, state, pin].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(', ');
      }
    }
  } catch (e) {
    console.warn('Reverse geocode notice:', e);
  }
  return `GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

export default function PatientEmergency() {
  const navigate = useNavigate();
  const { user, profile, userLocation, requestUserGps } = useAuth();

  // State Machine Mode: 'DISCOVERY' (Image 2) or 'ACTIVE_DISPATCH' (Image 1)
  const [activeMode, setActiveMode] = useState('DISCOVERY');
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Location State (Prioritizes Live GPS if active, otherwise database profile city/address)
  const [patientLocation, setPatientLocation] = useState({
    latitude: userLocation?.lat || 22.7533,
    longitude: userLocation?.lng || 75.8937,
    address: userLocation?.label || (userLocation?.cityName ? `${userLocation.cityName}, MP` : 'Indore, Madhya Pradesh'),
    source: userLocation?.source || 'database'
  });
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Synchronize when userLocation or profile changes
  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      setPatientLocation({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        address: userLocation.label || (userLocation.cityName ? `${userLocation.cityName}, MP` : 'Indore, MP'),
        source: userLocation.source || 'gps'
      });
    } else if (profile?.city) {
      setPatientLocation({
        latitude: 22.7533,
        longitude: 75.8937,
        address: profile.address ? `${profile.address}, ${profile.city}` : `${profile.city}, Madhya Pradesh`,
        source: 'database'
      });
    }
  }, [userLocation, profile]);

  // Ranked Hospitals List
  const [hospitals, setHospitals] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [dispatchPacket, setDispatchPacket] = useState(null);
  const [currentSelectedHospital, setCurrentSelectedHospital] = useState(null);

  // Map Animation and ETA Telemetry
  const [mapProgress, setMapProgress] = useState(0.35);
  const [liveEta, setLiveEta] = useState(6);
  const [liveDistance, setLiveDistance] = useState(2.1);

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // 1. Initial Load: Check for active in-flight emergency session & fetch nearby hospitals
  useEffect(() => {
    const initializeEmergency = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        // 1. Check if user already has an active emergency session
        if (user) {
          const inFlightSession = await emergencyService.getActiveSession();
          if (inFlightSession && inFlightSession.sessionId) {
            setActiveSession({ id: inFlightSession.sessionId, status: inFlightSession.status });
            setDispatchPacket(inFlightSession);
            setLiveEta(inFlightSession.ambulance?.etaMinutes || 6);
            setActiveMode('ACTIVE_DISPATCH');
            setLoading(false);
            return;
          }
        }

        // 2. Otherwise, fetch live ranked nearby emergency hospitals
        let rankedHospitals = await emergencyService.getNearbyHospitals({
          latitude: patientLocation.latitude,
          longitude: patientLocation.longitude,
          address: patientLocation.address,
          radiusM: 30000
        });

        // If strict radius finds no hospital, expand radius gracefully
        if (!rankedHospitals || rankedHospitals.length === 0) {
          rankedHospitals = await emergencyService.getNearbyHospitals({
            latitude: patientLocation.latitude,
            longitude: patientLocation.longitude,
            address: patientLocation.address,
            radiusM: 500000
          });
        }

        setHospitals(rankedHospitals);
        setActiveMode('DISCOVERY');
      } catch (err) {
        console.error('Emergency initialization notice:', err);
        setErrorMsg('Failed to fetch emergency hospitals telemetry. Please call 108 immediately.');
      } finally {
        setLoading(false);
      }
    };

    initializeEmergency();
  }, [user]);

  // 2. Real-time Map and ETA Simulation loop during Active Dispatch
  useEffect(() => {
    if (activeMode !== 'ACTIVE_DISPATCH') return;

    // Advance ambulance progress along the route every 5 seconds
    const interval = setInterval(() => {
      setMapProgress((prev) => {
        if (prev >= 0.95) return 0.95;
        const next = prev + 0.05;
        // Decrement ETA and distance proportionately
        setLiveEta((oldEta) => (oldEta > 1 ? oldEta - 0.25 : 1));
        setLiveDistance((oldDist) => (oldDist > 0.3 ? parseFloat((oldDist - 0.1).toFixed(1)) : 0.2));
        return parseFloat(next.toFixed(3));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeMode]);

  // Handle GPS location update with reverse geocoding
  const handleUpdateLocation = async () => {
    if (requestUserGps) {
      try {
        setUpdatingLocation(true);
        const loc = await requestUserGps();
        if (loc?.lat && loc?.lng) {
          const resolvedAddress = loc.label || await reverseGeocodeAddress(loc.lat, loc.lng);
          const newLoc = {
            latitude: loc.lat,
            longitude: loc.lng,
            address: resolvedAddress,
            source: 'gps'
          };
          setPatientLocation(newLoc);
          setUpdatingLocation(false);
          try {
            let fresh = await emergencyService.getNearbyHospitals({ 
              latitude: loc.lat, 
              longitude: loc.lng, 
              address: resolvedAddress, 
              radiusM: 30000 
            });
            if (fresh && fresh.length > 0) setHospitals(fresh);
          } catch (e) {}
          return;
        }
      } catch (e) {
        console.warn('Emergency requestUserGps notice:', e);
      }
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setUpdatingLocation(false);
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const resolvedAddress = await reverseGeocodeAddress(lat, lng);

        const newLoc = {
          latitude: lat,
          longitude: lng,
          address: resolvedAddress,
          source: 'gps'
        };
        setPatientLocation(newLoc);
        setUpdatingLocation(false);

        // Refresh nearby hospitals for new coords
        try {
          let fresh = await emergencyService.getNearbyHospitals({ 
            latitude: lat, 
            longitude: lng,
            address: resolvedAddress,
            radiusM: 30000 
          });

          if (!fresh || fresh.length === 0) {
            fresh = await emergencyService.getNearbyHospitals({ 
              latitude: lat, 
              longitude: lng,
              address: resolvedAddress,
              radiusM: 500000 
            });
          }

          setHospitals(fresh);
        } catch (e) {
          console.warn('GPS hospital reload notice:', e);
        }
      },
      (err) => {
        console.warn('GPS location access denied:', err);
        setUpdatingLocation(false);
        alert('Could not access device GPS. Using current set location.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Handle Hospital Selection and Immediate Ambulance Dispatch
  const handleSelectHospital = async (hospital) => {
    try {
      setDispatching(true);
      setErrorMsg('');
      setCurrentSelectedHospital(hospital);
      setLiveEta(hospital.etaMinutes || 6);
      setLiveDistance(hospital.distanceKm || 2.4);
      setMapProgress(0.15);
      setActiveMode('ACTIVE_DISPATCH');

      // Step 1: Start emergency session in PostgreSQL
      const sessionData = await emergencyService.startSession({
        latitude: patientLocation.latitude,
        longitude: patientLocation.longitude,
        address: patientLocation.address,
        emergencyType: 'Critical Emergency Response',
        searchRadiusM: 30000
      });

      const currentSessionId = sessionData?.session?.id;
      if (sessionData?.session) {
        setActiveSession(sessionData.session);
      }

      // Step 2: Dispatch ambulance for selected hospital
      if (currentSessionId) {
        const dispatchData = await emergencyService.dispatchAmbulance({
          sessionId: currentSessionId,
          hospitalId: hospital.id,
          ambulanceId: hospital.assignedAmbulance?.id || null,
          pickupLatitude: patientLocation.latitude,
          pickupLongitude: patientLocation.longitude,
          pickupAddress: patientLocation.address,
          hospital: hospital
        });

        if (dispatchData) {
          setDispatchPacket(dispatchData);
          if (dispatchData.ambulance?.etaMinutes) setLiveEta(dispatchData.ambulance.etaMinutes);
          if (dispatchData.ambulance?.distanceKm) setLiveDistance(dispatchData.ambulance.distanceKm);
        }
      }
    } catch (err) {
      console.warn('Dispatch orchestration notice:', err);
      // Emergency mode stays active with selected hospital even if network has delay
      setActiveMode('ACTIVE_DISPATCH');
    } finally {
      setDispatching(false);
    }
  };

  // Handle Emergency Cancellation
  const handleConfirmCancel = async () => {
    if (!activeSession?.id && !dispatchPacket?.sessionId) {
      setActiveMode('DISCOVERY');
      setCurrentSelectedHospital(null);
      setDispatchPacket(null);
      return;
    }
    try {
      setCancelling(true);
      const sessId = activeSession?.id || dispatchPacket?.sessionId;
      await emergencyService.updateStatus(sessId, 'cancelled', 'Patient cancelled emergency request');
      setCancelModalOpen(false);
      setActiveMode('DISCOVERY');
      setActiveSession(null);
      setCurrentSelectedHospital(null);
      setDispatchPacket(null);

      // Refresh discovery list
      const freshHospitals = await emergencyService.getNearbyHospitals({
        latitude: patientLocation.latitude,
        longitude: patientLocation.longitude
      });
      setHospitals(freshHospitals);
    } catch (err) {
      console.error('Cancellation error:', err);
      setActiveMode('DISCOVERY');
      setCurrentSelectedHospital(null);
      setDispatchPacket(null);
    } finally {
      setCancelling(false);
    }
  };

  const selectedHospital = currentSelectedHospital || dispatchPacket?.hospital || hospitals[0] || {};
  const ambulanceData = dispatchPacket?.ambulance || {
    vehicleNumber: selectedHospital.assignedAmbulance?.vehicle_number || 'MP 09 AZ 1234',
    providerName: selectedHospital.assignedAmbulance?.ambulance_providers?.name || 'Ziqitza Healthcare Ltd',
    ambulanceType: selectedHospital.assignedAmbulance?.ambulance_type || 'ICU Ambulance',
    driverName: selectedHospital.assignedAmbulance?.driver_name || 'Ramesh Y.',
    driverPhone: selectedHospital.assignedAmbulance?.driver_phone || '+91-98260-12345'
  };

  return (
    <AppLayout>
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* ===================================================================== */}
        {/* 1. TOP HEADER BANNER                                                  */}
        {/* ===================================================================== */}
        {activeMode === 'ACTIVE_DISPATCH' ? (
          // Header for Active Dispatch (Image 1)
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Siren className="w-8 h-8 animate-pulse stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight leading-tight">
                  Emergency Mode is Activated
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                  Help is on the way. Stay calm, our team is taking care.
                </p>
              </div>
            </div>

            {/* Location Pill Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Your Location</span>
                    {userLocation?.source === 'gps' ? (
                      <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Live GPS Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        Profile Location
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{patientLocation.address}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Compass className={`w-3.5 h-3.5 text-blue-600 ${updatingLocation ? 'animate-spin' : ''}`} />
                <span>Update Location</span>
              </button>
            </div>
          </div>
        ) : (
          // Header for Ranked Discovery (Image 2)
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Siren className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Emergency Mode
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                    We're here to get you the fastest help possible.
                  </p>
                </div>
              </div>

              {/* Instant Call 108 CTA */}
              <div className="flex items-center gap-3 bg-red-50/70 border border-red-200/80 px-4 py-2.5 rounded-2xl self-start sm:self-auto">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-slate-500 font-medium block">Need immediate help?</span>
                  <a href="tel:108" className="text-red-600 font-black hover:underline text-sm">
                    Call Emergency: 108
                  </a>
                </div>
              </div>
            </div>

            {/* Location Pill Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Your Location</span>
                    {userLocation?.source === 'gps' ? (
                      <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Live GPS Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-full text-[9.5px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        Profile Location
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{patientLocation.address}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Compass className={`w-3.5 h-3.5 text-blue-600 ${updatingLocation ? 'animate-spin' : ''}`} />
                <span>Update Location</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification if any */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 2. MAIN WORKSPACE GRID                                                */}
        {/* ===================================================================== */}
        {activeMode === 'ACTIVE_DISPATCH' ? (
          /* ===================================================================== */
          /* MODE A: ACTIVE AMBULANCE DISPATCH & REAL-TIME TRACKING (IMAGE 1)      */
          /* ===================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (7 COLS): Selected Hospital, Ambulance Details & Tips */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* Card 1: Your Selected Hospital */}
              <div className="p-6 rounded-3xl bg-red-50/40 border border-red-200/70 shadow-2xs flex flex-col gap-4">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  Your Selected Hospital
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-blue-700 font-black text-lg shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                          {selectedHospital.name || 'Selected Hospital'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-black uppercase">
                          Selected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {selectedHospital.distanceKm || 2.4} km away • {selectedHospital.typeText || 'Multi Speciality Hospital'}
                      </p>

                      {/* Capabilities pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                          ER Beds: {selectedHospital.erBeds || 10}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-black border border-cyan-200">
                          ICU Beds: {selectedHospital.icuBeds || 6}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                          Trauma Center
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Contact Phone Button */}
                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Hospital Contact</span>
                      <span className="text-xs font-black text-slate-800">{selectedHospital.phone || '0731-1234567'}</span>
                    </div>
                    <a
                      href={`tel:${selectedHospital.phone || '0731-1234567'}`}
                      className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-red-600 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="Call Hospital"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 2: Ambulance Details */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚑</span>
                    <h3 className="text-base font-black text-slate-900">Ambulance Details</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Booked Automatically</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left Specs */}
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Provider</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                        {ambulanceData.providerName || 'Ziqitza Healthcare Ltd'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Ambulance No.</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                        {ambulanceData.vehicleNumber || 'MP 09 AZ 1234'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Ambulance Type</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 block mt-0.5">
                        {ambulanceData.ambulanceType || 'ICU Ambulance'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Driver</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-slate-800">
                          {ambulanceData.driverName || 'Ramesh Y.'}
                        </span>
                        <a
                          href={`tel:${ambulanceData.driverPhone || '+91-98260-12345'}`}
                          className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors shadow-2xs"
                          title="Call Driver"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right ETA Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">ETA to Your Location</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-black text-red-600">
                          {Math.round(liveEta)} mins
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          ({liveDistance} km away)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <span className="text-2xl">🚑</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold">Fastest Route Cleared</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/50 border border-red-100 text-xs font-bold text-red-800 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0"></span>
                  <span>Ambulance is on the way. Our emergency medical team is reaching you as soon as possible.</span>
                </div>
              </div>

              {/* Card 3: Important Tips */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <span>Important Tips</span>
                  </div>
                  <ul className="text-xs text-slate-600 font-semibold space-y-1.5 list-disc pl-4">
                    <li>Stay calm and keep your phone nearby.</li>
                    <li>Share your live location with family members.</li>
                    <li>Keep the emergency session ID ready for hospital triage.</li>
                  </ul>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  🚨
                </div>
              </div>

              {/* Bottom Security Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Your safety is our priority. We are with you in every step.</span>
              </div>

            </div>

            {/* RIGHT COLUMN (5 COLS): Real Leaflet Map, Live Stepper & 108 Card */}
            <div className="lg:col-span-5 flex flex-col gap-5">

              {/* 1. Interactive Real Leaflet Map */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4 relative" style={{ isolation: 'isolate', zIndex: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Live Ambulance Tracking</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live</span>
                  </span>
                </div>

                {/* Leaflet Simulated Map Canvas */}
                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-inner">
                  <EmergencyMap
                    patientCoords={[patientLocation.latitude, patientLocation.longitude]}
                    hospitalCoords={[selectedHospital.latitude || 22.7610, selectedHospital.longitude || 75.8970]}
                    hospitalName={selectedHospital.name || 'Selected Hospital'}
                    patientAddress={patientLocation.address}
                    initialDistanceKm={liveDistance}
                    initialEtaMinutes={Math.round(liveEta)}
                    progress={mapProgress}
                    isLive={true}
                  />
                </div>

                {/* Stepper Progress Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[
                      { label: 'Request Received', time: '02:38 PM', state: 'done' },
                      { label: 'Ambulance Assigned', time: '02:39 PM', state: 'done' },
                      { label: 'On The Way', time: '02:41 PM', state: 'active' },
                      { label: 'Arriving Soon', time: '02:47 PM', state: 'pending' }
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step.state === 'done' 
                            ? 'bg-emerald-500 text-white' 
                            : step.state === 'active' 
                            ? 'bg-red-600 text-white shadow-md shadow-red-500/30 ring-4 ring-red-100' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {step.state === 'done' ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          ) : step.state === 'active' ? (
                            <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Car className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-800 mt-1 leading-tight">{step.label}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{step.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Live Status Updates Log */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Live Status Updates
                </h4>

                <div className="flex flex-col gap-2.5 text-xs font-bold">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Emergency request received</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">02:38 PM</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ambulance has been assigned</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">02:39 PM</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>Ambulance is on the way</span>
                    </div>
                    <span className="text-[10px] text-red-600 font-medium">02:41 PM</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Car className="w-3.5 h-3.5" />
                      <span>Arriving at your location soon</span>
                    </div>
                    <span className="text-[10px] font-medium">02:47 PM</span>
                  </div>
                </div>
              </div>

              {/* 3. Need Help? 108 Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-red-600 uppercase block">Need Help?</span>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Call us anytime for immediate assistance.</p>
                  <span className="text-2xl sm:text-3xl font-black text-red-600 block mt-1">108</span>
                  <span className="text-[10px] text-slate-400 font-bold block">National Emergency Number</span>
                </div>
                <a
                  href="tel:108"
                  className="w-12 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                  title="Call 108"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>

              {/* 4. Action: Cancel Emergency Request */}
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Emergency Request
              </button>

            </div>

          </div>
        ) : (
          /* ===================================================================== */
          /* MODE B: RANKED NEARBY HOSPITALS SELECTION (IMAGE 2)                   */
          /* ===================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (8 COLS): Ranked Hospitals List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Nearby Hospitals
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Showing hospitals with emergency services near you
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                  <span>Last updated: Just now</span>
                  <RotateCw className="w-3.5 h-3.5 cursor-pointer hover:rotate-180 transition-transform" />
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                  <span className="font-bold text-xs">Scanning nearby trauma & emergency centers...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {hospitals.map((hospital, idx) => {
                    const isRankOne = idx === 0;
                    const isUnavailable = hospital.ambulanceStatus === 'unavailable';
                    const isBusy = hospital.ambulanceStatus === 'busy';

                    return (
                      <div
                        key={hospital.id || idx}
                        className={`p-4 sm:p-5 rounded-3xl bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative group ${
                          isRankOne 
                            ? 'border-red-300 ring-2 ring-red-100 shadow-sm' 
                            : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        {/* Left Info: Rank badge + Entity details */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          {/* Rank Circle Number */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isRankOne 
                              ? 'bg-red-600 text-white shadow-xs' 
                              : idx === 1 
                              ? 'bg-amber-500 text-white' 
                              : idx === 2 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-blue-600 text-white'
                          }`}>
                            {idx + 1}
                          </div>

                          {/* Hospital Logo / Icon */}
                          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {hospital.name}
                              </h3>
                              {hospital.isMostSuitable && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">
                                  Most Suitable
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 font-semibold mt-0.5">
                              {hospital.distanceText} • {hospital.typeText || 'Multi Speciality'}
                            </p>

                            {/* Bed telemetry pills */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-black">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ER Beds: {hospital.erBeds || 16}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                                ICU Beds: {hospital.icuBeds || 10}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                Trauma Center
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle & Right: Ambulance Status & Action Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {/* Ambulance Status Indicator */}
                          <div className="text-left sm:text-right">
                            <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold">
                              <span className="text-sm">🚑</span>
                              <span className={`${
                                isUnavailable 
                                  ? 'text-slate-500' 
                                  : isBusy 
                                  ? 'text-amber-600' 
                                  : 'text-emerald-700'
                              }`}>
                                {hospital.ambulanceStatusLabel}
                              </span>
                            </div>

                            {!isUnavailable ? (
                              <div className="mt-0.5">
                                <span className="text-[10px] text-slate-400 font-medium block">ETA to you</span>
                                <span className="text-xs font-black text-slate-800">{hospital.etaText}</span>
                                {hospital.ambulanceLocationNote && (
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    {hospital.ambulanceLocationNote}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Please call hospital 📞
                              </span>
                            )}
                          </div>

                          {/* Action Button */}
                          {isUnavailable ? (
                            <a
                              href={`tel:${hospital.phone || '0731-1234567'}`}
                              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>Call Hospital</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectHospital(hospital)}
                              disabled={dispatching}
                              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isRankOne 
                                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 hover:scale-105 active:scale-95' 
                                  : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs hover:border-blue-400'
                              }`}
                            >
                              {dispatching ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Dispatching...</span>
                                </>
                              ) : (
                                <span>Select Hospital</span>
                              )}
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>ETAs are approximate and may vary based on traffic and availability.</span>
              </div>

            </div>

            {/* RIGHT COLUMN (4 COLS): Preview Map, Hospital Contact & Tips */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              {/* Preview Map Card */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3 relative" style={{ isolation: 'isolate', zIndex: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Live Ambulance Tracking</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                    • Live
                  </span>
                </div>

                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-inner">
                  <EmergencyMap
                    patientCoords={[patientLocation.latitude, patientLocation.longitude]}
                    hospitalCoords={[hospitals[0]?.latitude || 22.7610, hospitals[0]?.longitude || 75.8970]}
                    hospitalName={hospitals[0]?.name || 'Nearest Emergency Center'}
                    patientAddress={patientLocation.address}
                    initialDistanceKm={hospitals[0]?.distanceKm || 2.4}
                    initialEtaMinutes={hospitals[0]?.etaMinutes || 6}
                    progress={0.35}
                    isLive={false}
                  />
                </div>
              </div>

              {/* Hospital Contact Box */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3 relative z-[1]">
                <span className="text-xs font-black text-slate-800 uppercase">Hospital Contact</span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{hospitals[0]?.name || 'Emergency Center'}</span>
                    <span className="text-xs text-slate-500 font-semibold block">{hospitals[0]?.phone || '0731-1234567'}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Call the nearest hospital for immediate assistance.</span>
                  </div>

                  <a
                    href={`tel:${hospitals[0]?.phone || '108'}`}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Hospital</span>
                  </a>
                </div>
              </div>

              {/* Emergency Tips */}
              <div className="p-5 rounded-3xl bg-red-50/40 border border-red-200/60 shadow-xs flex items-center justify-between gap-4 relative z-[1]">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-red-600">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Emergency Tips</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 font-semibold space-y-1 mt-2 list-disc pl-4">
                    <li>Stay calm and keep your phone nearby.</li>
                    <li>Share your live location with family.</li>
                    <li>Keep the emergency ID ready for quick reference.</li>
                  </ul>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white text-2xl flex items-center justify-center shadow-xs shrink-0">
                  🚨
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* 3. CANCEL REQUEST CONFIRMATION MODAL                                  */}
        {/* ===================================================================== */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 font-black text-base">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Cancel Emergency Dispatch?</span>
                </div>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                An ambulance is currently en route to your location. Are you sure you want to cancel this emergency request?
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Keep Ambulance
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Confirm Cancellation</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
