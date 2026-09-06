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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useHospital } from '../../../context/HospitalContext';

export default function HospitalNavbar({ onToggleSidebar, isSidebarHovered = false }) {
  const { user, profile, signOut } = useAuth();
  const { 
    activeHospital, 
    toggleEmergency 
  } = useHospital();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Sync searchQuery when URL param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/hospital/bookings?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/hospital/bookings');
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
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

  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLiveNotifications = async () => {
    if (!user?.id) {
      setNotificationsList([
        { id: '1', title: 'New ICU Bed Reservation', message: 'Bed 204 allocated', time: '10 mins ago', unread: true },
        { id: '2', title: 'Ambulance Unit AMB-02 Incoming', message: 'ETA 6 mins with critical patient', time: '25 mins ago', unread: true },
        { id: '3', title: 'Dr. Amit Patel marked Available', message: 'OPD roster updated', time: '1 hour ago', unread: false }
      ]);
      setUnreadCount(2);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped = data.map(n => {
          const isUnread = !n.read_at;
          const diffMs = Date.now() - new Date(n.created_at).getTime();
          const diffMins = Math.round(diffMs / 60000);
          let timeStr = 'Just now';
          if (diffMins > 60 * 24) timeStr = `${Math.floor(diffMins / 1440)}d ago`;
          else if (diffMins > 60) timeStr = `${Math.floor(diffMins / 60)}h ago`;
          else if (diffMins > 0) timeStr = `${diffMins}m ago`;

          return {
            id: n.id,
            title: n.title || 'Platform Notification',
            message: n.message,
            time: timeStr,
            unread: isUnread,
            type: n.type
          };
        });
        setNotificationsList(mapped);
        setUnreadCount(mapped.filter(m => m.unread).length);
      } else {
        // Facility operational baseline
        setNotificationsList([
          { id: 'base-1', title: 'Hospital Node Connected', message: 'All EHR and telemetry services operating normally.', time: 'Just now', unread: false }
        ]);
        setUnreadCount(0);
      }
    } catch (e) {
      console.warn('Hospital notifications error:', e);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();

    if (!user?.id) return;
    const channelName = `hospital-navbar-notifs-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchLiveNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      setNotificationsList(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Mark all read error:', e);
    }
  };

  const handleMarkSingleRead = async (notifId) => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notifId);

      setNotificationsList(prev => prev.map(n => n.id === notifId ? { ...n, unread: false } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

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
      <div className="w-full max-w-[1720px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between gap-2.5 sm:gap-4 relative">
        
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search by Booking ID (BK-...), Hospital (HSP-...), patient, doctor..."
              className="w-full pl-4 pr-12 py-2.5 rounded-2xl bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />

            {/* Right Search Button (Matching Patient Panel AppNavbar) */}
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={triggerSearch}
                title="Search Bookings, Patients & Doctors"
                className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
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
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-88 max-w-[92vw] bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">Facility Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 ? (
                        <>
                          <span className="text-[10px] bg-rose-50 text-rose-600 font-extrabold px-1.5 py-0.5 rounded-md">
                            {unreadCount} New
                          </span>
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          All caught up
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-68 overflow-y-auto custom-scrollbar">
                    {notificationsList.map((n) => {
                      const isAdminDispatch = n.type === 'admin_dispatch';
                      return (
                        <div 
                          key={n.id} 
                          onClick={() => n.unread && handleMarkSingleRead(n.id)}
                          className={`p-2.5 rounded-xl text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                            isAdminDispatch 
                              ? (n.unread ? 'bg-amber-50/90 border border-amber-200 font-bold text-amber-950 shadow-xs' : 'bg-amber-50/40 text-slate-700 hover:bg-amber-50/60')
                              : (n.unread ? 'bg-blue-50/70 border border-blue-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50')
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold flex items-center gap-1.5 truncate">
                              {isAdminDispatch && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-wider shrink-0">
                                  Admin Notice
                                </span>
                              )}
                              <span className="truncate">{n.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">{n.time}</span>
                          </div>
                          {n.message && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                              {n.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
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
                  className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-[92vw] bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-1 text-xs"
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
