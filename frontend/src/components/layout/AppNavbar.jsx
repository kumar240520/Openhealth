import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  MapPin, 
  ChevronDown, 
  Bell, 
  User, 
  Settings, 
  ShieldCheck, 
  Gamepad2, 
  HelpCircle, 
  LogOut, 
  Check, 
  CheckCheck, 
  X, 
  Menu,
  Sparkles,
  Building2,
  Stethoscope,
  Activity,
  Heart,
  Clock,
  ArrowRight,
  Siren,
  FileText
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useAICare } from '../../context/AIFindCareContext';

export default function AppNavbar({ onToggleSidebar, isSidebarHovered = false }) {
  const { user, profile, userLocation, requestUserGps, disableUserGps, signOut } = useAuth();
  const { openAICareModal } = useAICare();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Indore, MP');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedFacilityType, setSelectedFacilityType] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState('all');
  const [maxBudget, setMaxBudget] = useState(150000);

  // Sync searchQuery with URL params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Dropdown States
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  // Notifications Data State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs for click outside
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const locationRef = useRef(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Patient';
  const displayRole = profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'PATIENT';

  // Available Specialties for Search Filter
  const availableSpecialties = [
    'All Specialties',
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Nephrology',
    'Gastroenterology',
    'Pulmonology',
    'General Surgery'
  ];

  // Fetch real notifications and patient location from database
  const fetchPatientLocation = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('city, state')
        .eq('user_id', user.id)
        .single();

      if (data?.city) {
        const stateAbbr = data.state === 'Madhya Pradesh' ? 'MP'
          : data.state === 'Maharashtra' ? 'MH'
          : data.state === 'Karnataka' ? 'KA'
          : data.state === 'Delhi NCR' ? 'DL'
          : data.state === 'Gujarat' ? 'GJ'
          : data.state === 'Rajasthan' ? 'RJ'
          : data.state === 'Uttar Pradesh' ? 'UP'
          : data.state === 'Tamil Nadu' ? 'TN'
          : data.state === 'Telangana' ? 'TS'
          : data.state;
        
        const formattedCity = stateAbbr ? `${data.city}, ${stateAbbr}` : data.city;
        setSelectedCity(formattedCity);
      }
    } catch (err) {
      console.warn('Patient location fetch notice:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.warn('Notifications fetch notice:', error);
      } else if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read_at).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Resolve notification icon, badge, and navigation route
  const getNotifMeta = (type) => {
    switch (type) {
      case 'booking':
      case 'bed_reservation':
        return {
          icon: <Building2 className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
          path: '/app/bookings'
        };
      case 'appointment':
      case 'consultation':
        return {
          icon: <Stethoscope className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border border-blue-200 text-blue-700',
          path: '/app/bookings'
        };
      case 'bill_analysis':
      case 'bill':
        return {
          icon: <FileText className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border border-amber-200 text-amber-700',
          path: '/app/bills'
        };
      case 'ai_analysis':
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50 border border-purple-200 text-purple-700',
          path: '/app/ai-analyzer'
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-50 border border-slate-200 text-slate-700',
          path: '/app/dashboard'
        };
    }
  };

  // Handle click on individual notification
  const handleNotificationClick = async (notif) => {
    if (!notif.read_at) {
      await markAsRead(notif.id);
    }
    setNotifDropdownOpen(false);
    const meta = getNotifMeta(notif.type);
    navigate(meta.path);
  };

  useEffect(() => {
    fetchPatientLocation();
    fetchNotifications();

    // Auto-refresh notifications every 12 seconds for live real-time feel
    const pollTimer = setInterval(() => {
      fetchNotifications();
    }, 12000);

    // Close dropdowns on outside click
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) setLocationPopoverOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(pollTimer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, profile]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user?.id).is('read_at', null);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Omni-search execution
  const handleSearchSubmit = (e) => {
    if (e.key && e.key !== 'Enter') return;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCity && selectedCity !== 'All') params.set('city', selectedCity.split(',')[0]);
    if (selectedSpecialty && selectedSpecialty !== 'All Specialties') params.set('specialty', selectedSpecialty);
    if (selectedFacilityType !== 'all') params.set('type', selectedFacilityType);
    if (selectedScheme !== 'all') params.set('scheme', selectedScheme);
    if (maxBudget < 150000) params.set('max_price', maxBudget);
    
    navigate(`/app/search?${params.toString()}`);
  };

  return (
    <>
      <motion.header 
        initial={false}
        animate={{
          left: isSidebarHovered ? 260 : 72
        }}
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30
        }}
        className="fixed top-0 right-0 h-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex items-center max-lg:!left-0"
      >
        
        {/* Full-width Responsive Navbar Content with Fluid Centered Search Bar */}
        <div className="w-full max-w-[1720px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between gap-2.5 sm:gap-4 relative">
          
          {/* ===================================================================== */}
          {/* Left: Mobile Toggle & Context Breadcrumb */}
          {/* ===================================================================== */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 z-10">
            
            {/* Mobile Brand Logo (Visible on mobile where sidebar is hidden) */}
            <button 
              type="button"
              onClick={() => navigate('/dashboard/patient')} 
              className="flex lg:hidden items-center gap-2 text-left cursor-pointer group flex-shrink-0"
            >
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Activity className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
            </button>

            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm focus:outline-none cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Context Breadcrumb */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-semibold select-none flex-shrink-0">
              <span className="text-slate-900 font-extrabold tracking-tight">OpenHealth</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-medium">Healthcare Discovery</span>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* Middle: Omni Search Bar (Fluid flex item that never overlaps edges)    */}
          {/* ===================================================================== */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto min-w-0 z-10">
            <div className="relative w-full flex items-center shadow-xs rounded-2xl bg-white">
              
              {/* Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search hospitals, doctors, treatments..."
                className="w-full pl-4 pr-20 py-2.5 rounded-2xl bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />

              {/* Right Filter & Search Buttons */}
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterModalOpen(true)}
                  title="Filter by City, Specialty & Schemes"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  title="Search"
                  className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

            </div>
          </div>

          {/* ===================================================================== */}
          {/* Right Action Icons: City Picker, + Find Care, Notifications & Profile */}
          {/* ===================================================================== */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 z-10">
            
            {/* Location Manager Container (Button, Popover & Continuous Prompt) */}
            <div className="relative hidden md:block" ref={locationRef}>
              
              {/* Main Location Status Button */}
              <button
                type="button"
                onClick={() => setLocationPopoverOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold shadow-xs select-none transition-all cursor-pointer ${
                  userLocation?.source === 'gps'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
                title="Click to manage location settings"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${userLocation?.source === 'gps' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>
                  {userLocation?.source === 'gps' 
                    ? 'Live GPS Active' 
                    : (userLocation?.cityName ? `${userLocation.cityName}` : selectedCity)}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${locationPopoverOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Continuous Message Box Down to Option (Showing until user turns on live location) */}
              {userLocation?.source !== 'gps' && !locationPopoverOpen && (
                <div 
                  onClick={async () => {
                    try {
                      await requestUserGps();
                    } catch (e) {
                      alert('Could not enable GPS. Please allow location permissions in your browser.');
                    }
                  }}
                  className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold shadow-md cursor-pointer hover:bg-amber-700 transition-all z-30 flex items-center gap-1 animate-bounce"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>📍 Turn on live location</span>
                </div>
              )}

              {/* Location Management Popover Dropdown */}
              {locationPopoverOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-[92vw] rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 text-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-slate-900 text-xs">Location Mode</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      userLocation?.source === 'gps'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {userLocation?.source === 'gps' ? 'Live GPS' : 'Database Profile'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Position</span>
                      <span className="font-bold text-slate-800 text-xs block mt-0.5">
                        {userLocation?.label || (userLocation?.cityName ? `${userLocation.cityName}, MP` : 'Indore, Madhya Pradesh')}
                      </span>
                      {userLocation?.lat && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>

                  {userLocation?.source === 'gps' ? (
                    <button
                      type="button"
                      onClick={() => {
                        disableUserGps();
                        setLocationPopoverOpen(false);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Turn Off Live Location
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await requestUserGps();
                          setLocationPopoverOpen(false);
                        } catch (e) {
                          alert('Could not enable GPS. Please allow location permissions in your browser.');
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Switch On Live Location</span>
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* + Find Care AI Diagnostic Modal Trigger */}
            <button
              type="button"
              onClick={() => openAICareModal()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Find Care</span>
            </button>

            {/* Emergency Mode Primary Orchestration Button */}
            <button
              type="button"
              onClick={() => navigate('/app/emergency')}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              <Siren className="w-3.5 h-3.5 stroke-[2.5] animate-pulse" />
              <span className="hidden sm:inline">Emergency Mode</span>
              <span className="sm:hidden text-[11px] font-black tracking-tight">SOS</span>
            </button>

          {/* ================================================================= */}
          {/* Notifications Center with Dropdown */}
          {/* ================================================================= */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-sm transition-all cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[92vw] rounded-2xl bg-white border border-slate-200 shadow-2xl py-3 z-50 text-xs">
                
                {/* Header */}
                <div className="px-4 pb-2.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[10px]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => {
                      const meta = getNotifMeta(n.type);
                      return (
                        <div 
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-50/80 transition-all cursor-pointer flex gap-3 items-start group ${
                            !n.read_at ? 'bg-blue-50/25 font-semibold' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200 group-hover:scale-105 transition-transform">
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs text-slate-900 truncate">{n.title}</span>
                              {!n.read_at && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5 font-medium leading-tight">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100/60">
                              <span className={`text-[9px] uppercase font-mono font-black px-1.5 py-0.5 rounded ${meta.bg}`}>
                                {n.type?.replace('_', ' ') || 'Notice'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                      <Bell className="w-6 h-6 text-slate-300" />
                      <span className="font-semibold text-slate-600 text-xs">No notifications yet</span>
                      <span className="text-[11px]">We'll notify you about bookings, reports & hospital updates.</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      navigate('/app/notifications');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 w-full cursor-pointer"
                  >
                    <span>View all notifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* User Profile Avatar with Comprehensive Dropdown Menu */}
          {/* ================================================================= */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-blue-500/30 overflow-hidden bg-slate-900 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName[0]?.toUpperCase()}</span>
                )}
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-[92vw] rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 text-xs">
                
                {/* User Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {displayName[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {user?.email}
                    </span>
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[9px] w-fit">
                      {displayRole}
                    </span>
                  </div>
                </div>

                {/* Profile Menu Links */}
                <div className="py-1">
                  
                  {/* My Profile */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/app/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  {/* Account Settings */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/app/settings');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  {/* Security & 2FA */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/app/security');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Security & 2FA</span>
                  </button>

                  {/* Health Games & Rewards */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/app/games');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors"
                  >
                    <Gamepad2 className="w-4 h-4 text-purple-500" />
                    <div className="flex items-center justify-between flex-1">
                      <span>Health Games & Rewards</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[9px]">
                        ★ 240 pts
                      </span>
                    </div>
                  </button>

                  {/* Help & Support */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/help');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Help & Support</span>
                  </button>

                </div>

                {/* Logout Button */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await signOut();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-red-600 font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          </div>
        </div>
      </motion.header>

      {/* ========================================================================= */}
      {/* MULTI-FACETED FILTER MODAL (Cities, Specialties, Schemes, Facility Types) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {filterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Discovery & Care Filters
                    </h3>
                    <p className="text-xs text-slate-400">
                      Refine hospital and doctor discovery options
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Filters */}
              <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5 custom-scrollbar text-xs">
                
                {/* 1. Target City */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>City / Region</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setSelectedCity(city)}
                        className={`px-3 py-2 rounded-xl text-left border transition-all ${
                          selectedCity === city 
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Medical Specialty */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                    <span>Medical Specialty / Department</span>
                  </label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {availableSpecialties.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Facility Accreditation */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Facility Accreditation & Quality</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'All Hospitals' },
                      { id: 'nabh', label: 'NABH Accredited' },
                      { id: 'jci', label: 'JCI Gold Standard' },
                      { id: 'icu_247', label: '24/7 ICU & Trauma' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFacilityType(f.id)}
                        className={`px-3 py-2 rounded-xl text-left border transition-all ${
                          selectedFacilityType === f.id 
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Government Schemes */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Government Schemes & Insurance</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'All Options' },
                      { id: 'pmjay', label: 'PM-JAY (Ayushman)' },
                      { id: 'cghs', label: 'CGHS Empanelled' },
                      { id: 'cashless', label: '100% Cashless TPA' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedScheme(s.id)}
                        className={`px-3 py-2 rounded-xl text-left border transition-all ${
                          selectedScheme === s.id 
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Max Budget Slider */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700">Estimated Procedure Budget</label>
                    <span className="font-black text-blue-600 text-sm">
                      Up to ₹{maxBudget.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="500000"
                    step="5000"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>₹10,000</span>
                    <span>₹2,50,000</span>
                    <span>₹5,00,000+</span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpecialty('All Specialties');
                    setSelectedFacilityType('all');
                    setSelectedScheme('all');
                    setMaxBudget(150000);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Reset Filters
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
