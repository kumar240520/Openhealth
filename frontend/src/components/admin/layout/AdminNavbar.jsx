import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Menu,
  Activity,
  ShieldCheck,
  RotateCw,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function AdminNavbar({ onToggleSidebar, isSidebarHovered = false, onRefresh, isRefreshing = false }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
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
      const q = encodeURIComponent(searchQuery.trim());
      navigate(`/admin/hospitals?q=${q}`);
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

  const adminName = profile?.full_name || 'Platform Administrator';

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
      className="fixed top-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex items-center max-lg:!left-0"
    >
      <div className="w-full max-w-[1720px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Node Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="uppercase text-[10px] tracking-wider font-bold">Platform Admin Portal</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">PostgreSQL Realtime CDC Active</span>
            <span className="md:hidden">Live CDC</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hospitals, doctors, users, audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="w-full pl-10 pr-4 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Live Refresh, Alerts & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        
        {/* Manual Data Refresh Trigger */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Realtime Database Telemetry"
            className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        {/* Realtime Alert Drawer Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
          </button>

          <AnimatePresence>
            {notifDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[92vw] rounded-2xl bg-white border border-slate-200 shadow-xl p-4 text-xs z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Security & Governance Feed
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                    CDC Realtime
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 hover:border-slate-300 transition-colors flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="font-semibold text-slate-900">Hospital Verification Review</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Apollo Hospitals submitted clinical registration certificate for review.</p>
                      <span className="text-[9px] text-slate-400 font-medium mt-1 block">2 min ago • PostgreSQL Trigger</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 hover:border-slate-300 transition-colors flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">ICU Bed Telemetry Updated</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Fortis Hospital occupancy synced: 4 ICU beds held, 8 available.</p>
                      <span className="text-[9px] text-slate-400 font-medium mt-1 block">5 min ago • Hospital Operations</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 hover:border-slate-300 transition-colors flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Doctor Credential Added</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Dr. Priya Sharma (Cardiology) registered medical council NMC-49281.</p>
                      <span className="text-[9px] text-slate-400 font-medium mt-1 block">12 min ago • Doctor Directory</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      navigate('/admin/audit-logs');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View All Audit & Telemetry Logs →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                {adminName}
              </span>
              <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">
                platform_admin
              </span>
            </div>
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-[92vw] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 text-xs z-50"
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="font-bold text-slate-900 truncate">{adminName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'platform.admin@openhealth.org'}</p>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/admin/dashboard');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Admin Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/admin/verification');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verification Queue</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Public Platform</span>
                </button>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      </div>
    </motion.header>
  );
}
