import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Building2, 
  User, 
  Star, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Trash2, 
  Loader2, 
  ExternalLink,
  Calendar,
  Heart
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';
import { getDistanceToHospital } from '../../services/geolocationService';

export default function PatientSaved() {
  const navigate = useNavigate();
  const { user, userLocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savedData, setSavedData] = useState({
    hospitals: [],
    doctors: [],
    totalCount: 0
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'hospitals' | 'doctors'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Fetch saved items
  const fetchSaved = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await patientService.getSavedItems();
      setSavedData(data || { hospitals: [], doctors: [], totalCount: 0 });
    } catch (err) {
      console.error('Error fetching saved items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [user]);

  // Show temporary toast
  const showToast = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Remove saved hospital
  const handleRemoveHospital = async (e, hospitalId, hospitalName) => {
    e.stopPropagation();
    try {
      await patientService.toggleSaveHospital(hospitalId);
      setSavedData(prev => ({
        ...prev,
        hospitals: prev.hospitals.filter(h => h.id !== hospitalId),
        totalCount: Math.max(0, prev.totalCount - 1)
      }));
      showToast(`${hospitalName} removed from saved.`);
    } catch (err) {
      alert('Failed to remove bookmark: ' + err.message);
    }
  };

  // Remove saved doctor
  const handleRemoveDoctor = async (e, doctorId, doctorName) => {
    e.stopPropagation();
    try {
      await patientService.toggleSaveDoctor(doctorId);
      setSavedData(prev => ({
        ...prev,
        doctors: prev.doctors.filter(d => d.id !== doctorId),
        totalCount: Math.max(0, prev.totalCount - 1)
      }));
      showToast(`${doctorName} removed from saved.`);
    } catch (err) {
      alert('Failed to remove bookmark: ' + err.message);
    }
  };

  // Filter items by search and tab
  const filteredHospitals = useMemo(() => {
    if (activeTab === 'doctors') return [];
    let list = savedData.hospitals || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => 
        (h.name || '').toLowerCase().includes(q) ||
        (h.address || '').toLowerCase().includes(q) ||
        (h.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [savedData.hospitals, activeTab, searchQuery]);

  const filteredDoctors = useMemo(() => {
    if (activeTab === 'hospitals') return [];
    let list = savedData.doctors || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        (d.name || '').toLowerCase().includes(q) ||
        (d.specialization || '').toLowerCase().includes(q) ||
        (d.hospitalName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [savedData.doctors, activeTab, searchQuery]);

  const totalVisibleCount = filteredHospitals.length + filteredDoctors.length;

  return (
    <AppLayout>
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 flex flex-col gap-6 select-none min-w-0">

        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs shadow-xl animate-fade-in flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* 1. HEADER & SEARCH BAR                                              */}
        {/* =================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
              <span>Dashboard</span>
              <span>&gt;</span>
              <span className="text-slate-700 font-extrabold">Saved</span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Saved Facilities & Doctors</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black">
                {savedData.hospitals.length + savedData.doctors.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
              Quick access to your bookmarked healthcare facilities and trusted specialists
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved hospitals or doctors..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. CATEGORY TABS                                                    */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: `All Saved (${savedData.hospitals.length + savedData.doctors.length})` },
            { id: 'hospitals', label: `Hospitals (${savedData.hospitals.length})` },
            { id: 'doctors', label: `Doctors (${savedData.doctors.length})` }
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

        {/* =================================================================== */}
        {/* 3. CONTENT AREA                                                     */}
        {/* =================================================================== */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Loading your bookmarked healthcare items...</span>
          </div>
        ) : totalVisibleCount === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bookmark className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No saved items found</h3>
            <p className="text-xs text-slate-400 font-semibold max-w-sm">
              {searchQuery 
                ? `No bookmarked items match "${searchQuery}".`
                : "You haven't bookmarked any hospitals or doctors yet. Bookmark facilities to quickly check beds and book appointments."}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => navigate('/app/hospitals')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Explore Hospitals
              </button>
              <button
                type="button"
                onClick={() => navigate('/app/doctors')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Find Specialists
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* 3A. Saved Hospitals Section */}
            {filteredHospitals.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Saved Hospitals ({filteredHospitals.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredHospitals.map(h => (
                    <div
                      key={h.id}
                      onClick={() => navigate(`/app/hospitals/${h.id}`)}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between gap-4 cursor-pointer group"
                    >
                      {/* Top: Image + Info + Unsave Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={h.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80'} 
                            alt={h.name} 
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {h.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{h.city || 'Indore'}, MP</span>
                              {(() => {
                                const dist = getDistanceToHospital(h, userLocation);
                                return dist ? (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-700 font-bold">{dist} km</span>
                                  </>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                              <span>{h.rating || '4.8'}</span>
                              <span className="text-slate-400">({h.review_count || 120})</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleRemoveHospital(e, h.id, h.name)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer shrink-0"
                          title="Remove from saved"
                        >
                          <Bookmark className="w-4 h-4 fill-rose-500" />
                        </button>
                      </div>

                      {/* Specialties tags */}
                      {h.specialties && Array.isArray(h.specialties) && (
                        <div className="flex flex-wrap gap-1">
                          {h.specialties.slice(0, 3).map((sp, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {sp}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bottom action row */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>NABH Accredited</span>
                        </span>

                        <div className="flex items-center gap-1 text-xs font-black text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          <span>View Hospital</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3B. Saved Doctors Section */}
            {filteredDoctors.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Saved Specialists ({filteredDoctors.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDoctors.map(d => (
                    <div
                      key={d.id}
                      onClick={() => navigate(`/app/doctors/${d.id}`)}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between gap-4 cursor-pointer group"
                    >
                      {/* Top: Avatar + Info + Unsave Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={d.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80'} 
                            alt={d.name} 
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`}
                            </h3>
                            <span className="text-xs text-blue-600 font-bold block truncate mt-0.5">
                              {d.specialization || 'Consultant Specialist'}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{d.hospitalName || 'Indore Hospital'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleRemoveDoctor(e, d.id, d.name)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer shrink-0"
                          title="Remove from saved"
                        >
                          <Bookmark className="w-4 h-4 fill-rose-500" />
                        </button>
                      </div>

                      {/* Details row: Exp + Fee */}
                      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 text-xs font-semibold text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Experience</span>
                          <span className="font-extrabold text-slate-800">{d.experience_years || 12} yrs</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block">Consultation Fee</span>
                          <span className="font-black text-emerald-600">₹{d.consultation_fee || 800}</span>
                        </div>
                      </div>

                      {/* Bottom action row */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                          <span>{d.rating || '4.8'}</span>
                          <span className="text-slate-400">({d.review_count || 45})</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-black text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          <span>Book Appointment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </AppLayout>
  );
}
