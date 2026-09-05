import React, { useState } from 'react';
import { 
  Star, 
  Heart, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorCard({ 
  doctor, 
  onBookAppointment, 
  isSaved = false, 
  onToggleSave 
}) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isSaved);
  const [imgError, setImgError] = useState(false);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    const newSaved = !saved;
    setSaved(newSaved);
    if (onToggleSave) {
      onToggleSave(doctor.id, newSaved);
    }
  };

  const fallbackImages = [
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80'
  ];

  const displayImage = (!imgError && doctor.image_url)
    ? doctor.image_url
    : fallbackImages[Math.abs((doctor.name?.length || 0) % fallbackImages.length)];

  const rating = doctor.rating ? Number(doctor.rating).toFixed(1) : '4.7';
  const reviewCount = doctor.review_count || 180;
  const experience = doctor.experience_years ? `${doctor.experience_years}+ years` : '10+ years';
  const fee = doctor.consultation_fee ? `₹${Number(doctor.consultation_fee)}` : '₹750';
  const hospitalName = doctor.hospitals?.name || doctor.hospital_name || 'City Hospital';
  const city = doctor.hospitals?.city || doctor.city || 'Indore';

  return (
    <div 
      onClick={() => navigate(`/app/doctors/${doctor.id}`)}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative p-4"
    >
      {/* Favorite Heart Button */}
      <button
        type="button"
        onClick={handleSaveClick}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-2xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
        title={saved ? 'Remove from Saved' : 'Save Doctor'}
      >
        <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Top Details Row: Photo + Bio info */}
      <div className="flex items-start gap-3.5">
        {/* Doctor Photo in clean rounded portrait container */}
        <div className="w-20 h-24 sm:w-22 sm:h-26 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-2xs relative">
          <img 
            src={displayImage} 
            alt={doctor.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Doctor Metadata */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-[14.5px] sm:text-[15px] font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
            {doctor.name}
          </h3>
          
          <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
            {doctor.specialization || 'Medical Specialist'}
          </p>

          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1 truncate">
            <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
            <span className="truncate">{hospitalName}, {city}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <div className="flex items-center gap-1 text-emerald-700 font-black">
              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>{rating}</span>
            </div>
            <span className="text-slate-400 text-[11px]">({reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      {/* Experience & Fee Details Row */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11.5px]">Experience</span>
          </div>
          <span className="font-bold text-slate-900 text-[11.5px]">{experience}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-slate-500 font-medium">Consultation Fee</span>
          <span className="text-[15px] font-black text-slate-900">{fee}</span>
        </div>
      </div>

      {/* Available Today Badge */}
      <div className="mt-2.5">
        <div className="w-full py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] tracking-wide text-center border border-emerald-100/80">
          Available Today
        </div>
      </div>

      {/* Action Buttons: Book Appointment & View Profile */}
      <div className="mt-3 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onBookAppointment ? onBookAppointment(doctor) : navigate(`/app/doctors/${doctor.id}?book=true`)}
          className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all text-center cursor-pointer"
        >
          Book Appointment
        </button>

        <button
          type="button"
          onClick={() => navigate(`/app/doctors/${doctor.id}`)}
          className="w-full py-1 text-center font-bold text-[11.5px] text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
