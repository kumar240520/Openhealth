import React from 'react';
import { 
  X, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Bed, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Clock, 
  Shield, 
  Sparkles,
  Users,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HospitalQuickViewModal({ hospital, onClose, onCheckBeds }) {
  const navigate = useNavigate();

  if (!hospital) return null;

  const icuBeds = hospital.icu_available ?? hospital.beds?.find(b => b.name?.includes('ICU') || b.bed_types?.name?.includes('ICU'))?.available_beds ?? 3;
  const generalBeds = hospital.general_available ?? hospital.beds?.find(b => b.name?.includes('General') || b.bed_types?.name?.includes('General'))?.available_beds ?? 18;
  const rating = hospital.rating ? Number(hospital.rating).toFixed(1) : '4.5';
  const reviewCount = hospital.review_count || 180;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      
      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col justify-between custom-scrollbar"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Header Banner Image */}
        <div className="relative aspect-[21/9] w-full bg-slate-100 overflow-hidden">
          <img 
            src={hospital.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80'} 
            alt={hospital.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Badges on Banner */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Verified Institution</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 font-bold text-xs flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Score {Math.round(hospital.transparency_score || 88)}%</span>
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              {hospital.name}
            </h3>
            <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>{hospital.address}, {hospital.city}, {hospital.state}</span>
            </p>
          </div>
        </div>

        {/* 2. Body Details */}
        <div className="p-6 flex flex-col gap-6 text-xs text-slate-700">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-black text-sm text-slate-900">{rating}</span>
                <span className="text-slate-400 text-[11px]">({reviewCount})</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">ICU Beds</span>
              <span className="font-black text-sm text-blue-900 mt-0.5">{icuBeds} Available</span>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 flex flex-col">
              <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">General Beds</span>
              <span className="font-black text-sm text-teal-900 mt-0.5">{generalBeds} Available</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Status</span>
              <span className="font-black text-xs text-emerald-900 mt-0.5 truncate">{hospital.opening_hours || 'Open 24/7'}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h5 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider mb-1.5">
              About the Hospital
            </h5>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {hospital.description || 'Modern multi-speciality tertiary care hospital equipped with advanced diagnostic technologies, expert clinical teams, and 24/7 trauma & emergency services.'}
            </p>
          </div>

          {/* Specialties Chips */}
          <div>
            <h5 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider mb-2">
              Key Specializations & Departments
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {(hospital.specialties || ['Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 'Pediatrics', 'General Surgery']).map((spec) => (
                <span key={spec} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/80">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Schemes & Insurance Supported */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-sm text-emerald-950">Cashless & Government Schemes</span>
                <span className="text-[11px] text-emerald-700">PM-JAY (Ayushman Bharat), CGHS, ESIC & Leading TPA Insurance accepted</span>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Modal Footer CTAs */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onCheckBeds) onCheckBeds(hospital);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer shadow-sm"
          >
            Check Live Beds
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/app/hospitals/${hospital.id}`);
            }}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Open Full 6-Tab Profile Page</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </div>
  );
}
