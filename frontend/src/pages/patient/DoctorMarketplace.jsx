import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  ChevronDown, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Search, 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Stethoscope, 
  X, 
  Sparkles 
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import DoctorCard from '../../components/marketplace/DoctorCard';
import DoctorFilterDrawer from '../../components/marketplace/DoctorFilterDrawer';
import BookAppointmentModal from '../../components/marketplace/BookAppointmentModal';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';
import { extractSearchTokens, matchesAnyKeyword } from '../../utils/searchMatcher';

export default function DoctorMarketplace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary filter states
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Indore');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('today');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Synchronize state when URL query params change (e.g. from Navbar Omni-Search)
  useEffect(() => {
    const q = searchParams.get('q');
    const city = searchParams.get('city');
    const specialty = searchParams.get('specialty');

    if (q !== null && q !== undefined) setSearchQuery(q);
    if (city && city !== 'All') {
      const cleanCity = city.split(',')[0].trim();
      setSelectedCity(cleanCity);
    }
    if (specialty && specialty !== 'all') {
      setSelectedSpecialty(specialty);
    }
    setCurrentPage(1);
  }, [searchParams]);

  // Dropdown menus open states
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [specialtyDropdownOpen, setSpecialtyDropdownOpen] = useState(false);
  const [experienceDropdownOpen, setExperienceDropdownOpen] = useState(false);
  const [availabilityDropdownOpen, setAvailabilityDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);

  // Advanced filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    maxFee: 2500,
    minExperience: 0,
    gender: 'all',
    videoOnly: false,
    languages: [],
    hospitals: []
  });

  // Booking modal & active doctor state
  const [bookingDoctor, setBookingDoctor] = useState(null);

  // Data fetching states
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedDoctorIds, setSavedDoctorIds] = useState(new Set());

  // Pagination states (matching reference image: 8 items per page default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setCityDropdownOpen(false);
      setSpecialtyDropdownOpen(false);
      setExperienceDropdownOpen(false);
      setAvailabilityDropdownOpen(false);
      setSortDropdownOpen(false);
      setPageSizeDropdownOpen(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch doctors from OpenHealth Backend Service & Registry
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await doctorService.getDoctors({ limit: 100 });
        setDoctors(res.doctors || []);
      } catch (err) {
        console.error('Error fetching doctors from backend:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch saved doctor IDs for logged in patient via backend API
  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) return;
      try {
        const saved = await doctorService.getSavedDoctors();
        if (saved && Array.isArray(saved)) {
          setSavedDoctorIds(new Set(saved.map(s => s.doctors?.id || s.doctor_id).filter(Boolean)));
        }
      } catch (e) {
        console.warn('Saved doctors fetch notice:', e);
      }
    };

    fetchSaved();
  }, [user]);

  // Handle toggle save/favorite doctor via backend API
  const handleToggleSave = async (doctorId, shouldSave) => {
    if (!user) return;
    try {
      if (shouldSave) {
        setSavedDoctorIds(prev => new Set([...prev, doctorId]));
      } else {
        setSavedDoctorIds(prev => {
          const next = new Set(prev);
          next.delete(doctorId);
          return next;
        });
      }
      await doctorService.toggleSaveDoctor(doctorId);
    } catch (err) {
      console.warn('Save doctor toggle error:', err);
    }
  };

  // Specialties catalogue
  const specialties = [
    { label: 'All Specialties', value: 'all' },
    { label: 'Orthopedic Surgeon', value: 'orthopedic' },
    { label: 'Cardiologist', value: 'cardiology' },
    { label: 'Neurologist', value: 'neurology' },
    { label: 'General Physician', value: 'general' },
    { label: 'Gynecologist', value: 'gynecology' },
    { label: 'Dermatologist', value: 'dermatology' },
    { label: 'Pediatrician', value: 'pediatrics' },
    { label: 'Urologist', value: 'urology' },
    { label: 'Oncologist', value: 'oncology' }
  ];

  const experienceOptions = [
    { label: 'All Experience', value: 'all' },
    { label: '5+ years', value: '5' },
    { label: '10+ years', value: '10' },
    { label: '15+ years', value: '15' }
  ];

  const availabilityOptions = [
    { label: 'Available Today', value: 'today' },
    { label: 'Available This Week', value: 'week' },
    { label: 'Any Availability', value: 'any' }
  ];

  const sortOptions = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Rating: High to Low', value: 'rating' },
    { label: 'Experience: Most Experienced', value: 'experience' },
    { label: 'Fee: Low to High', value: 'fee_asc' },
    { label: 'Fee: High to Low', value: 'fee_desc' }
  ];

  const cities = ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Mumbai'];

  // Filter & Sort Logic
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      // City filter
      const hospCity = (doc.hospitals?.city || '').toLowerCase();
      if (selectedCity && !hospCity.includes(selectedCity.toLowerCase())) {
        return false;
      }

      // 1. Responsive Keyword Search query (Matches if ANY keyword matches name, specialization, or hospital)
      if (searchQuery.trim()) {
        const queryTokens = extractSearchTokens(searchQuery);
        const doctorAttributes = [
          doc.name,
          doc.specialization,
          doc.qualifications,
          doc.hospitals?.name,
          doc.hospitals?.city
        ];
        if (!matchesAnyKeyword(queryTokens, doctorAttributes)) {
          return false;
        }
      }

      // 2. Responsive Specialty filter (Matches if ANY keyword or clinical synonym matches doctor specialization)
      if (selectedSpecialty !== 'all') {
        const specialtyTokens = extractSearchTokens(selectedSpecialty);
        const doctorSpecialties = [
          doc.specialization,
          doc.name,
          doc.hospitals?.name
        ];
        if (!matchesAnyKeyword(specialtyTokens, doctorSpecialties)) {
          return false;
        }
      }

      // Experience filter
      if (selectedExperience !== 'all') {
        const minExp = parseInt(selectedExperience, 10);
        if ((doc.experience_years || 0) < minExp) {
          return false;
        }
      }

      // Availability filter
      if (selectedAvailability === 'today' && doc.available_today === false) {
        return false;
      }

      // Advanced filters: Max Fee
      if (advancedFilters.maxFee && doc.consultation_fee > advancedFilters.maxFee) {
        return false;
      }

      // Advanced filters: Min Experience
      if (advancedFilters.minExperience && (doc.experience_years || 0) < advancedFilters.minExperience) {
        return false;
      }

      // Advanced filters: Hospital affiliation
      if (advancedFilters.hospitals?.length > 0) {
        const hospName = (doc.hospitals?.name || '').toLowerCase();
        const matched = advancedFilters.hospitals.some(h => hospName.includes(h.toLowerCase()));
        if (!matched) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'experience') {
        return (b.experience_years || 0) - (a.experience_years || 0);
      }
      if (sortBy === 'fee_asc') {
        return (a.consultation_fee || 0) - (b.consultation_fee || 0);
      }
      if (sortBy === 'fee_desc') {
        return (b.consultation_fee || 0) - (a.consultation_fee || 0);
      }
      // Default: Relevance (Indore featured doctors first, then by rating)
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [doctors, selectedCity, searchQuery, selectedSpecialty, selectedExperience, selectedAvailability, advancedFilters, sortBy]);

  // Pagination calculation
  const totalDoctors = filteredDoctors.length;
  const totalPages = Math.ceil(totalDoctors / pageSize) || 1;
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [filteredDoctors, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalDoctors);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] custom-scrollbar min-h-screen pb-16">
        
        {/* Main Content Container */}
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-6 min-w-0">
          
          {/* =================================================================== */}
          {/* 1. PAGE TITLE & TOTAL COUNT */}
          {/* =================================================================== */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Doctors in {selectedCity}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {totalDoctors} doctors found
            </p>
          </div>

          {/* Real-time Responsive Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search doctors by name, specialty, clinical qualifications, or hospital..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }}
                className="absolute right-3 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Discovery Specialty Chips */}
          <div className="flex items-center gap-2 overflow-x-auto touch-scroll-x scrollbar-none pb-1 custom-scrollbar select-none text-xs">
            {specialties.map(s => {
              const isActive = selectedSpecialty === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSelectedSpecialty(s.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {s.value === 'all' ? '🩺 All Specialties' : s.label}
                </button>
              );
            })}
          </div>

          {/* =================================================================== */}
          {/* 2. FILTER & CONTROLS TOOLBAR (Matches Reference Image) */}
          {/* =================================================================== */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-30">
            
            {/* Left Filter Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Location Pill */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedCity}, MP</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {cityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fadeIn">
                    {cities.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedCity(c);
                          setCityDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          selectedCity === c ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{c}, MP</span>
                        {selectedCity === c && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specialty Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setSpecialtyDropdownOpen(!specialtyDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span>
                    {specialties.find(s => s.value === selectedSpecialty)?.label || 'All Specialties'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {specialtyDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
                    {specialties.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setSelectedSpecialty(s.value);
                          setSpecialtyDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          selectedSpecialty === s.value ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{s.label}</span>
                        {selectedSpecialty === s.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setExperienceDropdownOpen(!experienceDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span>
                    {experienceOptions.find(e => e.value === selectedExperience)?.label || 'All Experience'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {experienceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fadeIn">
                    {experienceOptions.map(e => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() => {
                          setSelectedExperience(e.value);
                          setExperienceDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          selectedExperience === e.value ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{e.label}</span>
                        {selectedExperience === e.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setAvailabilityDropdownOpen(!availabilityDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span>
                    {availabilityOptions.find(a => a.value === selectedAvailability)?.label || 'Available Today'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {availabilityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fadeIn">
                    {availabilityOptions.map(a => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => {
                          setSelectedAvailability(a.value);
                          setAvailabilityDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          selectedAvailability === a.value ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{a.label}</span>
                        {selectedAvailability === a.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* More Filters CTA */}
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>More Filters</span>
                {(advancedFilters.minExperience > 0 || advancedFilters.maxFee < 2500 || advancedFilters.videoOnly) && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5" />
                )}
              </button>

            </div>

            {/* Right Controls: Sort & Grid/List View Mode */}
            <div className="flex items-center gap-2.5">
              
              {/* Sort By Dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span className="text-slate-500 font-medium">Sort by:</span>
                  <span>{sortOptions.find(s => s.value === sortBy)?.label || 'Relevance'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {sortDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fadeIn">
                    {sortOptions.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setSortBy(s.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          sortBy === s.value ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{s.label}</span>
                        {sortBy === s.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* =================================================================== */}
          {/* 3. DOCTORS GRID (4 Columns matching Reference Image) */}
          {/* =================================================================== */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Loading verified doctors in {selectedCity}...</span>
            </div>
          ) : paginatedDoctors.length === 0 ? (
            <div className="py-16 px-6 bg-white rounded-3xl border border-slate-200/90 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No doctors match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Try clearing specialty or experience filters to see more medical practitioners.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSpecialty('all');
                  setSelectedExperience('all');
                  setSelectedAvailability('any');
                  setAdvancedFilters({
                    maxFee: 2500,
                    minExperience: 0,
                    gender: 'all',
                    videoOnly: false,
                    languages: [],
                    hospitals: []
                  });
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer hover:bg-blue-700 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                : "flex flex-col gap-3"
            }>
              {paginatedDoctors.map(doctor => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isSaved={savedDoctorIds.has(doctor.id)}
                  onToggleSave={handleToggleSave}
                  onBookAppointment={(doc) => setBookingDoctor(doc)}
                />
              ))}
            </div>
          )}

          {/* =================================================================== */}
          {/* 4. BOTTOM PAGINATION BAR (Matches Reference Image) */}
          {/* =================================================================== */}
          {totalDoctors > 0 && (
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              
              {/* Range text */}
              <div className="text-slate-500 font-semibold">
                Showing {startIndex} to {endIndex} of {totalDoctors} doctors
              </div>

              {/* Page Buttons: < 1 2 3 ... 32 > */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[1, 2, 3].map(pageNum => {
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                        currentPage === pageNum
                          ? 'bg-blue-600 border border-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 4 && (
                  <span className="px-1 text-slate-400 font-bold">...</span>
                )}

                {totalPages > 3 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                      currentPage === totalPages
                        ? 'bg-blue-600 border border-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Show [8 ▾] per page selector */}
              <div className="flex items-center gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
                <span className="text-slate-500 font-semibold">Show</span>
                <button
                  type="button"
                  onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>{pageSize}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <span className="text-slate-500 font-semibold">per page</span>

                {pageSizeDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-1.5 w-24 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1 z-40 animate-fadeIn">
                    {[8, 12, 16, 24].map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setPageSize(sz);
                          setPageSizeDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${
                          pageSize === sz ? 'text-blue-600 bg-blue-50/50 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* =================================================================== */}
      {/* 5. MODALS & DRAWERS */}
      {/* =================================================================== */}
      
      {/* Book Appointment Modal */}
      {bookingDoctor && (
        <BookAppointmentModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBookingSuccess={() => {
            // Optional callback
          }}
        />
      )}

      {/* Advanced Filter Drawer */}
      <DoctorFilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
        onApply={() => {
          setFilterDrawerOpen(false);
          setCurrentPage(1);
        }}
        onReset={() => {
          setAdvancedFilters({
            maxFee: 2500,
            minExperience: 0,
            gender: 'all',
            videoOnly: false,
            languages: [],
            hospitals: []
          });
          setFilterDrawerOpen(false);
          setCurrentPage(1);
        }}
      />
    </AppLayout>
  );
}
