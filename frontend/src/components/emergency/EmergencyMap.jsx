import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import emergencyService from '../../services/emergencyService';

// Default Coordinates (Gwalior)
const DEFAULT_PATIENT_COORDS = [26.2183, 78.1828]; // Gwalior Center
const DEFAULT_HOSPITAL_COORDS = [26.2150, 78.1800]; // Nearby Gwalior Hospital

export default function EmergencyMap({ 
  patientCoords = DEFAULT_PATIENT_COORDS, 
  hospitalCoords = DEFAULT_HOSPITAL_COORDS,
  hospitalName = 'Nearby Hospital',
  patientAddress = 'Your Location',
  initialDistanceKm = 2.1,
  initialEtaMinutes = 6,
  progress = 0.35, // 0 = at hospital, 1 = at patient
  isLive = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambulanceMarkerRef = useRef(null);
  const hospitalMarkerRef = useRef(null);
  const patientMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Dynamic Real Road Waypoints & Stats
  const [waypoints, setWaypoints] = useState([]);
  const [roadStats, setRoadStats] = useState({
    distanceKm: initialDistanceKm,
    etaMinutes: initialEtaMinutes
  });
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Helper to calculate interpolated position along real road waypoints
  const getInterpolatedPosition = (pts, prog) => {
    if (!pts || pts.length === 0) return hospitalCoords;
    if (pts.length === 1) return pts[0];

    const clampedProg = Math.max(0, Math.min(1, prog));
    const totalSegments = pts.length - 1;
    const currentSegmentFloat = clampedProg * totalSegments;
    const segmentIndex = Math.min(Math.floor(currentSegmentFloat), totalSegments - 1);
    const segmentFraction = currentSegmentFloat - segmentIndex;

    const p1 = pts[segmentIndex];
    const p2 = pts[segmentIndex + 1] || p1;

    const lat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
    const lng = p1[1] + (p2[1] - p1[1]) * segmentFraction;

    return [lat, lng];
  };

  // 1. Fetch Real Driving Route via OSRM whenever hospitalCoords or patientCoords change
  useEffect(() => {
    let isMounted = true;

    const fetchRealRoute = async () => {
      try {
        setLoadingRoute(true);
        const routeData = await emergencyService.getDrivingRoute(hospitalCoords, patientCoords);
        if (isMounted && routeData?.waypoints?.length > 0) {
          setWaypoints(routeData.waypoints);
          setRoadStats({
            distanceKm: routeData.distanceKm || initialDistanceKm,
            etaMinutes: routeData.etaMinutes || initialEtaMinutes
          });
        }
      } catch (err) {
        console.warn('Driving route fetch notice:', err);
      } finally {
        if (isMounted) setLoadingRoute(false);
      }
    };

    fetchRealRoute();

    return () => {
      isMounted = false;
    };
  }, [hospitalCoords[0], hospitalCoords[1], patientCoords[0], patientCoords[1]]);

  // 2. Initialize Leaflet Map Instance once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: patientCoords,
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // OpenStreetMap clean tile layer (no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc'
      }).addTo(map);

      // Patient Marker (Pulsing Red Beacon Pin)
      const patientIcon = L.divIcon({
        className: 'custom-patient-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.4); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 22px; height: 22px; background: rgba(239, 68, 68, 0.6); border-radius: 50%;"></div>
            <div style="width: 14px; height: 14px; background: #dc2626; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 2;"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const pMarker = L.marker(patientCoords, { icon: patientIcon })
        .addTo(map)
        .bindTooltip(patientAddress || 'Your Location', { permanent: false, direction: 'top' });
      patientMarkerRef.current = pMarker;

      // Hospital Marker
      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `
          <div style="width: 30px; height: 30px; background: #2563eb; border: 2px solid #ffffff; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 12px rgba(37,99,235,0.45); color: white; font-weight: 900; font-size: 15px;">
            H
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const hMarker = L.marker(hospitalCoords, { icon: hospitalIcon })
        .addTo(map)
        .bindTooltip(hospitalName, { permanent: false, direction: 'top' });
      hospitalMarkerRef.current = hMarker;

      // Polyline Route Container
      const routeLine = L.polyline([], {
        color: '#dc2626',
        weight: 4.5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLineRef.current = routeLine;

      // Ambulance Moving Marker
      const ambulanceIcon = L.divIcon({
        className: 'custom-ambulance-marker',
        html: `
          <div style="width: 44px; height: 32px; background: #ffffff; border: 2px solid #dc2626; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220,38,38,0.4); font-size: 18px;">
            🚑
          </div>
        `,
        iconSize: [44, 32],
        iconAnchor: [22, 16]
      });

      const ambMarker = L.marker(hospitalCoords, { icon: ambulanceIcon, zIndexOffset: 1000 }).addTo(map);
      ambulanceMarkerRef.current = ambMarker;

      // ResizeObserver to ensure Leaflet recalculates on container dimension changes
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      mapInstanceRef.current = map;

      return () => {
        resizeObserver.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // 3. Update Markers, Polyline, and Map Bounds when Waypoints, Hospital, or Patient Coords update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update Hospital Marker
    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.setLatLng(hospitalCoords);
      hospitalMarkerRef.current.setTooltipContent(hospitalName);
    }

    // Update Patient Marker
    if (patientMarkerRef.current) {
      patientMarkerRef.current.setLatLng(patientCoords);
      if (patientAddress) {
        patientMarkerRef.current.setTooltipContent(patientAddress);
      }
    }

    // Update Polyline with real road waypoints
    if (routeLineRef.current && waypoints.length > 0) {
      routeLineRef.current.setLatLngs(waypoints);

      // Smoothly zoom and fit both the hospital and patient into view
      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      const fallbackBounds = L.latLngBounds([hospitalCoords, patientCoords]);
      map.fitBounds(fallbackBounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [waypoints, hospitalCoords[0], hospitalCoords[1], patientCoords[0], patientCoords[1], hospitalName, patientAddress]);

  // 4. Update Ambulance Marker Position dynamically along the real road path
  useEffect(() => {
    if (!ambulanceMarkerRef.current) return;

    const currentPts = waypoints.length > 0 ? waypoints : [hospitalCoords, patientCoords];
    const newPos = getInterpolatedPosition(currentPts, progress);
    ambulanceMarkerRef.current.setLatLng(newPos);
  }, [progress, waypoints]);

  return (
    <div 
      className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100" 
      style={{ 
        isolation: 'isolate', 
        zIndex: 0,
        transform: 'translateZ(0)',
        WebkitMaskImage: '-webkit-radial-gradient(white, black)'
      }}
    >
      
      {/* 1. Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 overflow-hidden" />

      {/* 2. Top-Left Floating Distance Badge */}
      <div className="absolute top-3 left-3 z-10 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Road Distance</span>
        <span className="text-xs sm:text-sm font-black text-slate-900">
          {roadStats.distanceKm} km
        </span>
      </div>

      {/* 3. Top-Right Floating Live Telemetry Badge */}
      {isLive && (
        <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-emerald-500/95 text-white text-[11px] font-black tracking-wide shadow-md flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span>Live GPS</span>
        </div>
      )}

      {/* 4. Bottom Center Real Road Navigation Banner */}
      <div className="absolute bottom-3 left-3 right-3 z-10 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm flex items-center justify-between text-[11px] text-slate-700 font-bold gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
          <span className="truncate">{hospitalName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-red-600 font-extrabold max-w-[50%] truncate">
          <span>Active Route</span>
          <span>→</span>
          <span className="text-slate-900 truncate" title={patientAddress}>{patientAddress || 'Your Location'}</span>
        </div>
      </div>

      {/* Loading Route Indicator */}
      {loadingRoute && (
        <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-2xs flex items-center justify-center">
          <div className="px-4 py-2 rounded-xl bg-slate-900/80 text-white text-xs font-bold shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>Calculating live road route...</span>
          </div>
        </div>
      )}

    </div>
  );
}
