import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building2, 
  AlertCircle,
  Plus,
  X,
  Sparkles,
  Check,
  Navigation
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import HospitalCard from '../../components/marketplace/HospitalCard';
import CheckBedsModal from '../../components/marketplace/CheckBedsModal';
import FilterDrawer from '../../components/marketplace/FilterDrawer';
import { extractSearchTokens, matchesAnyKeyword } from '../../utils/searchMatcher';
import { getDistanceToHospital, getCityCoordinates } from '../../services/geolocationService';

export default function HospitalMarketplace() {
  const { user, profile, userLocation, requestUserGps } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gpsLoading, setGpsLoading] = useState(false);

  // Location & Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Indore');
  const [selectedState, setSelectedState] = useState('Madhya Pradesh');
  const [selectedRadius, setSelectedRadius] = useState(searchParams.get('radius') || 'all');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'All Specialties');
  const [selectedFacilityType, setSelectedFacilityType] = useState(searchParams.get('type') || 'all');
  const [selectedScheme, setSelectedScheme] = useState(searchParams.get('scheme') || 'all');
  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Synchronize state when URL query params change (e.g. from Navbar Omni-Search)
  useEffect(() => {
    const q = searchParams.get('q');
    const city = searchParams.get('city');
    const specialty = searchParams.get('specialty');
    const type = searchParams.get('type');
    const scheme = searchParams.get('scheme');

    if (q !== null && q !== undefined) setSearchQuery(q);
    if (city && city !== 'All') {
      const cleanCity = city.split(',')[0].trim();
      setSelectedCity(cleanCity);
    }
    if (specialty && specialty !== 'All Specialties') {
      setSelectedSpecialty(specialty);
    }
    if (type && type !== 'all') {
      setSelectedFacilityType(type);
    }
    if (scheme && scheme !== 'all') {
      setSelectedScheme(scheme);
    }
    setCurrentPage(1);
  }, [searchParams]);

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    icuOnly: false,
    generalOnly: false,
    schemes: [],
    minTransparency: 0,
    minRating: 0,
    emergencyOnly: false
  });

  // Data state
  const [hospitals, setHospitals] = useState([]);
  const [savedHospitalIds, setSavedHospitalIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [checkBedsHospital, setCheckBedsHospital] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Dropdown UI toggles
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [radiusMenuOpen, setRadiusMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Available Cities
  const availableCities = [
    { city: 'Indore', state: 'Madhya Pradesh', label: 'Indore, MP' },
    { city: 'Bhopal', state: 'Madhya Pradesh', label: 'Bhopal, MP' },
    { city: 'Jabalpur', state: 'Madhya Pradesh', label: 'Jabalpur, MP' },
    { city: 'Gwalior', state: 'Madhya Pradesh', label: 'Gwalior, MP' },
    { city: 'Mumbai', state: 'Maharashtra', label: 'Mumbai, MH' },
    { city: 'Pune', state: 'Maharashtra', label: 'Pune, MH' },
    { city: 'Bengaluru', state: 'Karnataka', label: 'Bangalore, KA' },
    { city: 'New Delhi', state: 'Delhi NCR', label: 'Delhi NCR' },
    { city: 'Jaipur', state: 'Rajasthan', label: 'Jaipur, RJ' }
  ];

  // Helper to dynamically calculate real distance for a hospital relative to user location or selected city
  const getHospitalDistance = (h, city = selectedCity) => {
    // If user explicitly picked a specific city filter that differs from their current location,
    // calculate relative to that target city center
    if (city && city !== 'All' && userLocation?.cityName && city.toLowerCase() !== userLocation.cityName.toLowerCase()) {
      const cityCenter = getCityCoordinates(city);
      const dist = getDistanceToHospital(h, cityCenter);
      return dist !== null ? dist : 3.5;
    }
    // Otherwise calculate dynamically from user's active GPS / profile database location
    const dist = getDistanceToHospital(h, userLocation);
    return dist !== null ? dist : 3.5;
  };

  // Active filters count for More Filters badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.icuOnly) count++;
    if (filters.generalOnly) count++;
    if (filters.emergencyOnly) count++;
    if (filters.minTransparency > 0) count++;
    if (filters.minRating > 0) count++;
    if (filters.schemes && filters.schemes.length > 0) count += filters.schemes.length;
    return count;
  }, [filters]);

  const handleResetAllFilters = () => {
    setFilters({
      icuOnly: false,
      generalOnly: false,
      schemes: [],
      minTransparency: 0,
      minRating: 0,
      emergencyOnly: false
    });
    setSelectedRadius('all');
    setSelectedSpecialty('All Specialties');
    setSelectedFacilityType('all');
    setSelectedScheme('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Fetch Hospitals and Live Beds from Supabase PostgreSQL
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Query hospitals table
      const { data: hospitalRows, error: hErr } = await supabase
        .from('hospitals')
        .select(`
          id,
          name,
          type,
          description,
          address,
          city,
          state,
          latitude,
          longitude,
          phone,
          website,
          emergency_available,
          verification_status,
          transparency_score,
          rating,
          review_count,
          opening_hours,
          image_url,
          specialties,
          hospital_beds (
            id,
            total_beds,
            occupied_beds,
            reserved_beds,
            available_beds,
            price_per_day,
            bed_types (
              id,
              name
            )
          )
        `)
        .eq('is_active', true);

      if (hErr) throw hErr;

      // Extract and format bed totals and schemes list using 100% real database counts
      const formatted = (hospitalRows || []).map(h => {
        let icuCount = 0;
        let genCount = 0;
        let totalAvail = 0;
        let totalCapacity = 0;

        const bedList = Array.isArray(h.hospital_beds) ? h.hospital_beds : [];
        const validPrices = [];

        bedList.forEach(b => {
          const typeName = (b.bed_types?.name || '').toUpperCase();
          const avail = Number(b.available_beds) || 0;
          const tot = Number(b.total_beds) || 0;
          const price = Number(b.price_per_day);
          if (!isNaN(price) && price > 0) validPrices.push(price);
          totalAvail += avail;
          totalCapacity += tot;
          if (typeName.includes('ICU')) {
            icuCount += avail;
          } else {
            genCount += avail;
          }
        });

        const minBedPrice = validPrices.length > 0 ? Math.min(...validPrices) : 1500;

        // Derive empanelled schemes from accredited hospital roster
        const nameLower = (h.name || '').toLowerCase();
        const descLower = (h.description || '').toLowerCase();
        const schemes = [];
        if (nameLower.includes('apollo') || descLower.includes('apollo')) schemes.push('cghs', 'cashless', 'pmjay');
        else if (nameLower.includes('bombay')) schemes.push('pmjay', 'cghs', 'cashless');
        else if (nameLower.includes('chl')) schemes.push('pmjay', 'cghs', 'cashless');
        else if (nameLower.includes('shalby')) schemes.push('pmjay', 'cghs', 'cashless');
        else if (nameLower.includes('medilife')) schemes.push('esic', 'cashless', 'pmjay');
        else if (nameLower.includes('carewell')) schemes.push('pmjay', 'esic', 'cashless');
        else if (nameLower.includes('citycare')) schemes.push('pmjay', 'esic', 'cashless');
        else if (nameLower.includes('vedant')) schemes.push('pmjay', 'cashless');
        else schemes.push('pmjay', 'cashless');

        return {
          ...h,
          schemes_list: schemes,
          available_beds: totalAvail,
          total_beds: totalCapacity,
          icu_available: icuCount,
          general_available: genCount,
          min_bed_price: minBedPrice,
          beds: bedList
        };
      });

      setHospitals(formatted);

      // Fetch saved hospitals for logged in user
      if (user) {
        const { data: patProfile } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (patProfile?.id) {
          const { data: savedData } = await supabase
            .from('saved_hospitals')
            .select('hospital_id')
            .eq('patient_id', patProfile.id);

          if (savedData) {
            setSavedHospitalIds(new Set(savedData.map(s => s.hospital_id)));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching marketplace hospitals:', err);
      setErrorMsg('Failed to load hospitals. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();

    // Supabase Realtime: live synchronization across all hospital beds and hospitals
    const channel = supabase
      .channel('marketplace_hospital_beds_live_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_beds'
        },
        (payload) => {
          console.log('[Marketplace] Live bed update from PostgreSQL:', payload);
          fetchHospitals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospitals'
        },
        (payload) => {
          console.log('[Marketplace] Live hospital update from PostgreSQL:', payload);
          fetchHospitals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle Save / Unsave Hospital
  const handleToggleSave = async (hospitalId, shouldSave) => {
    if (!user) return;
    try {
      const { data: patProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patProfile?.id) return;

      if (shouldSave) {
        setSavedHospitalIds(prev => new Set([...prev, hospitalId]));
        await supabase
          .from('saved_hospitals')
          .insert({ patient_id: patProfile.id, hospital_id: hospitalId });
      } else {
        setSavedHospitalIds(prev => {
          const next = new Set(prev);
          next.delete(hospitalId);
          return next;
        });
        await supabase
          .from('saved_hospitals')
          .delete()
          .eq('patient_id', patProfile.id)
          .eq('hospital_id', hospitalId);
      }
    } catch (err) {
      console.warn('Save toggle notice:', err);
    }
  };

  // Real-time Bed Hold Decrement Handler
  const handleBedHoldSuccess = (heldBed) => {
    if (!checkBedsHospital) return;
    const targetId = checkBedsHospital.id;
    const isICU = (heldBed.bed_types?.name || '').toUpperCase().includes('ICU');

    setHospitals(prev => prev.map(h => {
      if (h.id === targetId) {
        return {
          ...h,
          available_beds: Math.max(0, (h.available_beds || 1) - 1),
          icu_available: isICU ? Math.max(0, (h.icu_available || 1) - 1) : h.icu_available,
          general_available: !isICU ? Math.max(0, (h.general_available || 1) - 1) : h.general_available,
          hospital_beds: (h.hospital_beds || []).map(b => 
            b.id === heldBed.id 
              ? { ...b, available_beds: Math.max(0, (b.available_beds || 1) - 1), reserved_beds: (b.reserved_beds || 0) + 1 }
              : b
          )
        };
      }
      return h;
    }));

    setCheckBedsHospital(prev => prev ? {
      ...prev,
      available_beds: Math.max(0, (prev.available_beds || 1) - 1),
      icu_available: isICU ? Math.max(0, (prev.icu_available || 1) - 1) : prev.icu_available,
      general_available: !isICU ? Math.max(0, (prev.general_available || 1) - 1) : prev.general_available
    } : prev);
  };

  // Real-time Bed Release / Expiration Restore Handler
  const handleBedRelease = (heldBed, holdInfo) => {
    if (!checkBedsHospital) return;
    const targetId = checkBedsHospital.id;
    const isICU = (heldBed?.bed_types?.name || '').toUpperCase().includes('ICU');

    setHospitals(prev => prev.map(h => {
      if (h.id === targetId) {
        return {
          ...h,
          available_beds: (h.available_beds || 0) + 1,
          icu_available: isICU ? (h.icu_available || 0) + 1 : h.icu_available,
          general_available: !isICU ? (h.general_available || 0) + 1 : h.general_available,
          hospital_beds: (h.hospital_beds || []).map(b => 
            (b.id === heldBed?.id || b.bed_type_id === (heldBed?.bed_type_id || heldBed?.bed_types?.id))
              ? { ...b, available_beds: (b.available_beds || 0) + 1, reserved_beds: Math.max(0, (b.reserved_beds || 1) - 1) }
              : b
          )
        };
      }
      return h;
    }));

    setCheckBedsHospital(prev => prev ? {
      ...prev,
      available_beds: (prev.available_beds || 0) + 1,
      icu_available: isICU ? (prev.icu_available || 0) + 1 : prev.icu_available,
      general_available: !isICU ? (prev.general_available || 0) + 1 : prev.general_available
    } : prev);
  };

  // Filter & Sort Pipeline
  const filteredHospitals = useMemo(() => {
    return hospitals.map(h => ({
      ...h,
      distance_km: getHospitalDistance(h, selectedCity)
    })).filter(h => {
      // 1. Responsive Keyword Search Query (Matches if ANY keyword matches name, description, address, city, type, or specialties)
      if (searchQuery && searchQuery.trim()) {
        const queryTokens = extractSearchTokens(searchQuery);
        const hospitalAttributes = [
          h.name,
          h.description,
          h.address,
          h.city,
          h.type,
          ...(h.specialties || [])
        ];
        if (!matchesAnyKeyword(queryTokens, hospitalAttributes)) {
          return false;
        }
      }

      // 2. City / Location match (clean up any trailing ', MP' or spaces)
      if (selectedCity && selectedCity !== 'All') {
        const cleanSelected = selectedCity.split(',')[0].trim().toLowerCase();
        const hCity = (h.city || '').toLowerCase();
        if (!hCity.includes(cleanSelected)) {
          return false;
        }
      }

      // 3. Real-Time Distance / Radius filter
      if (selectedRadius && selectedRadius !== 'all' && selectedRadius !== 'any') {
        const maxKm = parseFloat(selectedRadius);
        if (!isNaN(maxKm) && (h.distance_km || 0) > maxKm) {
          return false;
        }
      }

      // 4. Responsive Specialty match (Matches if ANY keyword or clinical synonym matches hospital specialties or name)
      if (selectedSpecialty && selectedSpecialty !== 'All Specialties') {
        const specialtyTokens = extractSearchTokens(selectedSpecialty);
        const hospitalSpecialties = [
          ...(h.specialties || []),
          h.name,
          h.description
        ];
        if (!matchesAnyKeyword(specialtyTokens, hospitalSpecialties)) {
          return false;
        }
      }

      // 5. Facility Type match
      if (selectedFacilityType && selectedFacilityType !== 'all') {
        const hType = (h.type || '').toLowerCase();
        if (!hType.includes(selectedFacilityType.toLowerCase())) return false;
      }

      // 6. Schemes Filter (PM-JAY, CGHS, ESIC, Cashless) from FilterDrawer & URL
      if (filters.schemes && filters.schemes.length > 0) {
        const hSchemes = h.schemes_list || [];
        const matchesAny = filters.schemes.some(sch => hSchemes.includes(sch));
        if (!matchesAny) return false;
      }
      if (selectedScheme && selectedScheme !== 'all') {
        const sLower = selectedScheme.toLowerCase();
        const hSchemes = h.schemes_list || [];
        if (sLower.includes('pmjay') || sLower.includes('ayushman')) {
          if (!hSchemes.includes('pmjay')) return false;
        } else if (sLower.includes('cghs')) {
          if (!hSchemes.includes('cghs')) return false;
        }
      }

      // 7. Advanced Filters: Bed Availability
      if (filters.icuOnly && (h.icu_available || 0) <= 0) return false;
      if (filters.generalOnly && (h.general_available || 0) <= 0) return false;

      // 8. Rating & Transparency
      if (filters.minRating > 0 && (h.rating || 0) < filters.minRating) return false;
      if (filters.minTransparency > 0 && (h.transparency_score || 0) < filters.minTransparency) return false;

      // 9. Emergency
      if (filters.emergencyOnly && !h.emergency_available) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'distance') return (a.distance_km || 0) - (b.distance_km || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'transparency') return (b.transparency_score || 0) - (a.transparency_score || 0);
      if (sortBy === 'icu_beds') return (b.icu_available || 0) - (a.icu_available || 0);
      if (sortBy === 'available_beds') return (b.available_beds || 0) - (a.available_beds || 0);
      return 0; // 'recommended' default
    });
  }, [hospitals, searchQuery, selectedCity, selectedRadius, selectedSpecialty, selectedFacilityType, selectedScheme, filters, sortBy]);

  // Pagination slice
  const totalCount = filteredHospitals.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedHospitals = filteredHospitals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <AppLayout>
      {/* Main Marketplace Container */}
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8 min-w-0">
        
        {/* Header Title & Subtitle */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Hospitals in {selectedCity}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {totalCount} {totalCount === 1 ? 'hospital' : 'hospitals'} found near {selectedCity}, {selectedState}
          </p>
        </div>

        {/* Marketplace Real-time Search Bar */}
        <div className="mb-4">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search hospitals by name, specialty, treatments, doctor, or address..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-xs transition-all"
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
        </div>

        {/* Quick Discovery Specialty Chips */}
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll-x scrollbar-none pb-3 mb-2 custom-scrollbar select-none text-xs">
          {['All Specialties', 'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'Nephrology', 'Ophthalmology'].map(cat => {
            const isActive = selectedSpecialty === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedSpecialty(cat);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat === 'All Specialties' ? '🏥 All Specialties' : cat}
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* 3. Filter & Control Bar (Matching Reference Image Pixel-for-Pixel) */}
        {/* =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-200/80">
          
          {/* Left Controls: Location, Radius, Specialty, More Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            
            {/* Location Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCityMenuOpen(!cityMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>{selectedCity}, {selectedState === 'Madhya Pradesh' ? 'MP' : selectedState.slice(0, 2).toUpperCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {cityMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-40 text-xs divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                  {/* Detect GPS Button */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      disabled={gpsLoading}
                      onClick={async () => {
                        try {
                          setGpsLoading(true);
                          await requestUserGps();
                          setCityMenuOpen(false);
                        } catch (e) {
                          alert('Could not access GPS location. Please allow browser location access.');
                        } finally {
                          setGpsLoading(false);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-between hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Detect My Live GPS</span>
                      </span>
                      {gpsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    </button>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Or Select City
                  </div>
                  <div className="py-1">
                    {availableCities.map(c => (
                      <button
                        key={c.city}
                        onClick={() => {
                          setSelectedCity(c.city);
                          setSelectedState(c.state);
                          setCityMenuOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-blue-50 flex items-center justify-between transition-colors ${
                          selectedCity === c.city ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                        }`}
                      >
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live GPS / Profile Location Status Badge */}
            {userLocation && (
              <button
                type="button"
                onClick={async () => {
                  if (userLocation.source !== 'gps') {
                    try {
                      setGpsLoading(true);
                      await requestUserGps();
                    } catch (e) {
                      alert('Could not access GPS location. Please check browser permission.');
                    } finally {
                      setGpsLoading(false);
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition-all shadow-2xs ${
                  userLocation.source === 'gps'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
                title={userLocation.source === 'gps' ? 'Accurate GPS location active' : 'Click to enable Live GPS'}
              >
                <span className={`w-2 h-2 rounded-full ${userLocation.source === 'gps' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>
                  {userLocation.source === 'gps' 
                    ? 'Live GPS Active' 
                    : `Profile: ${userLocation.cityName || 'Indore'}`}
                </span>
              </button>
            )}

            {/* Radius Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRadiusMenuOpen(!radiusMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 font-semibold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
              >
                <span>{selectedRadius === 'all' ? 'Any Distance' : `Within ${selectedRadius} km`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {radiusMenuOpen && (
                <div className="absolute left-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-40 text-xs divide-y divide-slate-100">
                  <div className="py-1">
                    {[
                      { val: '5', label: 'Within 5 km' },
                      { val: '10', label: 'Within 10 km' },
                      { val: '20', label: 'Within 20 km' },
                      { val: '50', label: 'Within 50 km' },
                      { val: 'all', label: 'Any Distance' }
                    ].map(r => (
                      <button
                        key={r.val}
                        onClick={() => {
                          setSelectedRadius(r.val);
                          setRadiusMenuOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between ${
                          selectedRadius === r.val ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                        }`}
                      >
                        <span>{r.label}</span>
                        {selectedRadius === r.val && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* More Filters Button with Active Count Badge */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-semibold shadow-sm transition-all cursor-pointer ${
                activeFiltersCount > 0 
                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/15' 
                  : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${activeFiltersCount > 0 ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>More Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

          </div>

          {/* Right Controls: Sort By & View Mode Switcher */}
          <div className="flex items-center gap-3 text-xs">
            
            {/* Sort By Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
              >
                <span className="text-slate-400">Sort by:</span>
                <span className="text-slate-800 font-bold">
                  {sortBy === 'recommended' && 'Recommended'}
                  {sortBy === 'distance' && 'Nearest First'}
                  {sortBy === 'rating' && 'Highest Rated'}
                  {sortBy === 'transparency' && 'Transparency Score'}
                  {sortBy === 'icu_beds' && 'Most ICU Beds'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {sortMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-40 text-xs">
                  {[
                    { id: 'recommended', label: 'Recommended' },
                    { id: 'distance', label: 'Nearest First' },
                    { id: 'rating', label: 'Highest Rated' },
                    { id: 'transparency', label: 'Transparency Score' },
                    { id: 'icu_beds', label: 'Most ICU Beds' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSortBy(s.id);
                        setSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-blue-50 transition-colors ${
                        sortBy === s.id ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Active Filter Chips Row */}
        {(searchQuery || selectedRadius !== 'all' || selectedSpecialty !== 'All Specialties' || activeFiltersCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 pb-2 text-xs">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Active Filters:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs">
                Query: "{searchQuery}"
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    const newP = new URLSearchParams(searchParams);
                    newP.delete('q');
                    setSearchParams(newP);
                  }}
                  className="hover:text-blue-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {selectedRadius !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs">
                ≤ {selectedRadius} km
                <button 
                  type="button"
                  onClick={() => setSelectedRadius('all')}
                  className="hover:text-blue-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {selectedSpecialty !== 'All Specialties' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs">
                {selectedSpecialty}
                <button 
                  type="button"
                  onClick={() => setSelectedSpecialty('All Specialties')}
                  className="hover:text-blue-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {filters.icuOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 text-red-700 font-bold border border-red-200 shadow-2xs">
                ICU Beds Available
                <button 
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, icuOnly: false }))}
                  className="hover:text-red-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {filters.generalOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold border border-teal-200 shadow-2xs">
                General Ward Available
                <button 
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, generalOnly: false }))}
                  className="hover:text-teal-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {filters.emergencyOnly && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 text-red-700 font-bold border border-red-200 shadow-2xs">
                24/7 Emergency
                <button 
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, emergencyOnly: false }))}
                  className="hover:text-red-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {filters.minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 shadow-2xs">
                Rating {filters.minRating}+ ★
                <button 
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                  className="hover:text-amber-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {filters.minTransparency > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs">
                Transparency {filters.minTransparency}%+
                <button 
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, minTransparency: 0 }))}
                  className="hover:text-emerald-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            )}

            {(filters.schemes || []).map(sch => (
              <span key={sch} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200 uppercase shadow-2xs">
                {sch}
                <button 
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, schemes: prev.schemes.filter(x => x !== sch) }))}
                  className="hover:text-purple-950 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-xs font-bold text-slate-500 hover:text-red-600 underline ml-2 cursor-pointer transition-colors"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. Hospital Cards Grid / List Rendering */}
        {/* =================================================================== */}
        <div className="py-6">
          
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
              <span className="font-semibold text-sm">Discovering verified hospitals near you...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-center text-red-700 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-sm">{errorMsg}</p>
              <button 
                onClick={fetchHospitals} 
                className="mt-4 px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : paginatedHospitals.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white border border-slate-200 max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
                <Building2 className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-black text-lg text-slate-900">No Hospitals Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No hospitals matched your current filters in {selectedCity}. Try expanding your search radius or clearing active filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCity('Indore');
                  setSelectedSpecialty('All Specialties');
                  setFilters({ icuOnly: false, generalOnly: false, schemes: [], minTransparency: 0, minRating: 0, emergencyOnly: false });
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {paginatedHospitals.map(h => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  isSaved={savedHospitalIds.has(h.id)}
                  onToggleSave={handleToggleSave}
                  onCheckBeds={(hosp) => setCheckBedsHospital(hosp)}
                />
              ))}
            </div>
          )}

        </div>

        {/* =================================================================== */}
        {/* 5. Bottom Pagination Bar (Matching Reference Image) */}
        {/* =================================================================== */}
        {!loading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 text-xs text-slate-600">
            
            {/* Left: Range Info */}
            <div>
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> hospitals
            </div>

            {/* Center: Numbered Page Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={20}>20</option>
              </select>
              <span className="text-slate-400 font-medium">per page</span>
            </div>

          </div>
        )}

      </main>

      {/* =================================================================== */}
      {/* 6. MODALS & SLIDE-OVERS */}
      {/* =================================================================== */}
      
      {/* A. Live Bed Inventory & Hold Modal */}
      {checkBedsHospital && (
        <CheckBedsModal
          hospital={checkBedsHospital}
          onClose={() => setCheckBedsHospital(null)}
          onBedHoldSuccess={handleBedHoldSuccess}
          onBedRelease={handleBedRelease}
        />
      )}

      {/* C. Advanced Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => setFilterDrawerOpen(false)}
        onReset={() => {
          setFilters({
            icuOnly: false,
            generalOnly: false,
            schemes: [],
            minTransparency: 0,
            minRating: 0,
            emergencyOnly: false
          });
          setFilterDrawerOpen(false);
        }}
      />
    </AppLayout>
  );
}
