import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Activity,
  Check,
  Building2,
  Siren,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useHospital } from '../../../context/HospitalContext';

export default function HospitalNavbar({ onToggleSidebar, isSidebarHovered = false }) {
  const { user, profile, signOut } = useAuth();
  const { 
    activeHospital, 
    toggleEmergency 
  } = useHospital();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/hospital/bookings?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      if (signOut) await signOut();
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };

  const notificationsList = [
    { id: 1, title: 'New ICU Bed Reservation', time: '10 mins ago', unread: true },
    { id: 2, title: 'Ambulance Unit AMB-02 Incoming', time: '25 mins ago', unread: true },
    { id: 3, title: 'Dr. Amit Patel marked Available', time: '1 hour ago', unread: false },
    { id: 4, title: 'Monthly Transparency Score updated: 88/100', time: 'Yesterday', unread: false }
  ];

  return (
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
      <div className="w-full h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2.5 sm:gap-4 relative">
        
        {/* ===================================================================== */}
        {/* Left: Mobile Toggle & Context Breadcrumb */}
        {/* ===================================================================== */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 z-10">
          
          {/* Mobile Brand Logo */}
          <button 
            type="button"
            onClick={() => navigate('/hospital/dashboard')} 
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
            <span className="text-blue-600 font-bold">Hospital Operations</span>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* Middle: Fluid Omni Search Bar (Exact AppNavbar styling) */}
        {/* ===================================================================== */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto min-w-0 z-10">
          <div className="relative w-full flex items-center shadow-xs rounded-2xl bg-white">
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search patients, bookings, doctors, treatments..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* Right: Hospital Switcher, Emergency Toggle, Notifications & Profile */}
        {/* ===================================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 z-10">
          
          {/* Single-Tenant Hospital Identity Badge */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="truncate max-w-[180px] font-bold text-slate-900 leading-tight">
                {activeHospital?.name || 'Hospital Facility'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {activeHospital?.city || 'Indore'} • {activeHospital?.type || 'Multi-Speciality'}
              </span>
            </div>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Facility
            </span>
          </div>

          {/* Live Casualty / Emergency Status Toggle */}
          <button
            type="button"
            onClick={toggleEmergency}
            title="Click to toggle emergency casualty status"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeHospital?.emergency_available !== false
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeHospital?.emergency_available !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{activeHospital?.emergency_available !== false ? 'Casualty: Active' : 'Casualty: Full'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <AnimatePresence>
              {notifDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">Hospital Alerts</span>
                    <span className="text-[10px] bg-rose-50 text-rose-600 font-extrabold px-1.5 py-0.5 rounded-md">
                      2 New
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {notificationsList.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2 rounded-xl text-xs flex flex-col gap-0.5 ${n.unread ? 'bg-blue-50/70 border border-blue-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {activeHospital?.name ? activeHospital.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                  {activeHospital?.name || 'Apollo Admin'}
                </span>
                <span className="text-[10px] text-blue-600 font-bold">
                  Super Admin
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-1 text-xs"
                >
                  <div className="p-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-900 block truncate">{activeHospital?.name || 'Hospital Facility'}</span>
                    <span className="text-[10px] text-slate-400">Hospital Administration Suite</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/hospital/profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Hospital Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold border-t border-slate-100 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </motion.header>
  );
}
