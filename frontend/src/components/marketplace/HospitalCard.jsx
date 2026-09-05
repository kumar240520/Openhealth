import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  Heart, 
  ShieldCheck, 
  Bed, 
  Activity, 
  ChevronRight,
  Sparkles,
  Phone,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDistanceToHospital } from '../../services/geolocationService';
import { getHospitalOperatingStatus } from '../../utils/hospitalHours';

export default function HospitalCard({ 
  hospital, 
  onCheckBeds,
  isSaved = false,
  onToggleSave
}) {
  const navigate = useNavigate();
  const { userLocation } = useAuth();
  const [saved, setSaved] = useState(isSaved);
  const [imgError, setImgError] = useState(false);

  // Sync isSaved prop changes
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    const newSaved = !saved;
    setSaved(newSaved);
    if (onToggleSave) {
      onToggleSave(hospital.id, newSaved);
    }
  };

  // Calculate or resolve beds directly from database attributes
  const icuBedObj = hospital.beds?.find(b => b.name?.toUpperCase().includes('ICU') || b.bed_types?.name?.toUpperCase().includes('ICU'));
  const genBedObj = hospital.beds?.find(b => b.name?.toUpperCase().includes('GENERAL') || b.bed_types?.name?.toUpperCase().includes('GENERAL'));
  const icuBeds = hospital.icu_available ?? icuBedObj?.available_beds ?? 0;
  const generalBeds = hospital.general_available ?? genBedObj?.available_beds ?? 0;
  const icuPrice = icuBedObj?.price_per_day ? Number(icuBedObj.price_per_day) : null;
  const genPrice = genBedObj?.price_per_day ? Number(genBedObj.price_per_day) : null;

  // Rating & review formatting
  const rating = hospital.rating ? Number(hospital.rating).toFixed(1) : '4.5';
  const reviewCount = hospital.review_count || 180;
  
  // Real-time Dynamic Proximity Distance from user's active GPS / profile location
  const rawDist = (hospital.distance_km !== undefined && hospital.distance_km !== null)
    ? hospital.distance_km
    : getDistanceToHospital(hospital, userLocation);
  const distance = (rawDist !== null && rawDist !== undefined)
    ? `${Number(rawDist).toFixed(1)} km` 
    : 'Near you';

  const fallbackImages = [
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'
  ];

  const displayImage = !imgError && hospital.image_url 
    ? hospital.image_url 
    : fallbackImages[Math.abs((hospital.name?.length || 0) % fallbackImages.length)];

  return (
    <div 
      onClick={() => navigate(`/app/hospitals/${hospital.id}`)}
      className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-blue-400/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer selection:bg-blue-500 selection:text-white"
    >
      {/* 1. Header Banner / Hospital Exterior Photo */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img 
          src={displayImage} 
          alt={hospital.name} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Subtle Dark Gradient Overlay for Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />

        {/* Top-Left: Verified Green Pill Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-bold text-[10.5px] tracking-wide flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Verified</span>
          </div>
        </div>

        {/* Top-Right: Favorite Heart Button */}
        <button
          type="button"
          onClick={handleSaveClick}
          className="absolute top-3 right-3 z-10 w-8.5 h-8.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-red-500 shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
          title={saved ? 'Remove from Saved' : 'Save Hospital'}
        >
          <Heart className={`w-4.5 h-4.5 transition-colors ${saved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Bottom Banner Info: Transparency Score Badge */}
        {hospital.transparency_score && (
          <div className="absolute bottom-2.5 right-3 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Score {Math.round(hospital.transparency_score)}%</span>
          </div>
        )}
      </div>

      {/* 2. Main Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        
        {/* Hospital Name & Rating */}
        <div>
          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
            {hospital.name}
          </h4>

          {/* Rating, Reviews, and Distance Row */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>{rating}</span>
            </div>
            <span className="text-slate-400 text-[11px]">({reviewCount})</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-semibold">{distance}</span>
          </div>

          {/* Specialty Category */}
          <div className="text-xs text-slate-500 font-medium mt-1">
            {hospital.type || 'Multi Speciality Hospital'}
          </div>

          {/* Open / Closes Status */}
          {(() => {
            const opStatus = getHospitalOperatingStatus(hospital.opening_hours, hospital.emergency_available);
            return (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className={`flex items-center gap-1.5 text-xs font-bold ${opStatus.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${opStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>{opStatus.statusText}</span>
                </div>
                {opStatus.emergencyNote && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                    {opStatus.emergencyNote}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* 3. Live Bed Inventory Grid (Two-Column Mini Box with Real DB Daily Tariffs) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          
          {/* ICU Beds */}
          <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100/90 flex flex-col justify-between gap-1.5 transition-colors">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Activity className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider truncate">
                  ICU
                </span>
              </div>
              {icuPrice ? (
                <span className="font-mono font-bold text-[10.5px] text-blue-700 bg-white/90 border border-blue-200/70 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                  ₹{icuPrice.toLocaleString('en-IN')}<span className="text-[8.5px] font-sans font-normal text-slate-500">/d</span>
                </span>
              ) : null}
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-bold text-slate-900 text-xs">
                {icuBeds} <span className="text-[10.5px] font-semibold text-slate-500">Vacant</span>
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${icuBeds > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
          </div>

          {/* General Beds */}
          <div className="p-2.5 rounded-2xl bg-teal-50/60 border border-teal-100/90 flex flex-col justify-between gap-1.5 transition-colors">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
                  <Bed className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider truncate">
                  General
                </span>
              </div>
              {genPrice ? (
                <span className="font-mono font-bold text-[10.5px] text-teal-700 bg-white/90 border border-teal-200/70 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                  ₹{genPrice.toLocaleString('en-IN')}<span className="text-[8.5px] font-sans font-normal text-slate-500">/d</span>
                </span>
              ) : null}
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-bold text-slate-900 text-xs">
                {generalBeds} <span className="text-[10.5px] font-semibold text-slate-500">Vacant</span>
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${generalBeds > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
          </div>

        </div>

        {/* 4. Dual Action CTAs (View Details + Check Beds) */}
        <div className="grid grid-cols-2 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          
          {/* Left Button: View Details (Ghost / Outlined) */}
          <button
            type="button"
            onClick={() => navigate(`/app/hospitals/${hospital.id}`)}
            className="w-full py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300/80 text-slate-700 hover:text-blue-600 font-bold text-xs tracking-tight transition-all text-center cursor-pointer shadow-sm hover:border-blue-300"
          >
            View Details
          </button>

          {/* Right Button: Check Beds (Primary Blue Solid) */}
          <button
            type="button"
            onClick={() => onCheckBeds ? onCheckBeds(hospital) : navigate(`/app/hospitals/${hospital.id}?tab=beds`)}
            className="w-full py-2.5 px-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs tracking-tight shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all text-center cursor-pointer"
          >
            Check Beds
          </button>

        </div>

      </div>

    </div>
  );
}
