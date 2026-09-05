import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  Building2, 
  Stethoscope,
  Bell, 
  FileText, 
  ShieldCheck, 
  Receipt, 
  Calendar, 
  Bookmark, 
  Settings, 
  User, 
  LogOut, 
  Activity,
  X,
  ChevronRight,
  Siren,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AppSidebar({ isOpen, onClose, isHovered: controlledHover, onHoverChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  // Expand on Hover state (matching landing page ScrollProgress effect)
  const [internalHover, setInternalHover] = useState(false);
  const isHovered = controlledHover !== undefined ? controlledHover : internalHover;
  const setHover = (val) => {
    setInternalHover(val);
    if (onHoverChange) onHoverChange(val);
  };

  // User Display Info (fallback to 'Hitesh Kumar' as shown in reference image)
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Hitesh Kumar';
  const displayInitial = displayName.charAt(0).toUpperCase() || 'H';

  // Navigation Items matching the reference image pixel-for-pixel
  const primaryNav = [
    { name: 'Dashboard', path: '/dashboard/patient', icon: LayoutDashboard },
    { name: 'Hospitals', path: '/app/hospitals', icon: Building2 },
    { name: 'Doctors', path: '/app/doctors', icon: Stethoscope },
    { name: 'Emergency Mode', path: '/app/emergency', icon: Siren, isEmergency: true },
    { name: 'Bookings', path: '/app/bookings', icon: Calendar },
    { name: 'My Bills', path: '/app/bills', icon: Receipt },
    { name: 'Reports', path: '/app/reports', icon: FileCheck },
    { name: 'Saved', path: '/app/saved', icon: Bookmark },
  ];

  const bottomNav = [
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'Profile', path: '/app/profile', icon: User },
    { name: 'Logout', action: 'logout', icon: LogOut, isLogout: true },
  ];

  const handleLogout = async () => {
    try {
      if (signOut) {
        await signOut();
      }
      navigate('/login');
    } catch (err) {
      console.warn('Logout error:', err);
      navigate('/login');
    }
  };

  const isCurrentActive = (itemPath) => {
    if (!itemPath) return false;
    if (location.pathname === itemPath) return true;
    if (itemPath === '/app/hospitals' && location.pathname.startsWith('/app/hospitals')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Solid Light-Colored Expandable Sidebar Rail */}
      <motion.aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        initial={false}
        animate={{
          width: isHovered ? 260 : 72,
        }}
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30,
        }}
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/90 shadow-[4px_0_24px_rgba(0,0,0,0.06)] flex flex-col justify-between overflow-hidden select-none transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        
        {/* =================================================================== */}
        {/* 1. TOP BRAND HEADER */}
        {/* =================================================================== */}
        <div className="h-18 px-3.5 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
          <button 
            type="button"
            onClick={() => navigate('/dashboard/patient')} 
            className="flex items-center gap-3 text-left cursor-pointer group min-w-0"
          >
            {/* Brand Logo Squircle */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>

            {/* Brand Title & Sub-headlines (Reveals on Hover) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col min-w-0 whitespace-nowrap overflow-hidden"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[17px] font-black tracking-tight text-slate-900 leading-tight">
                      OpenHealth
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block mt-0.5">
                    HEALTHCARE PLATFORM
                  </span>
                  <span className="text-[8.5px] font-medium text-slate-400 tracking-tight block -mt-0.5 truncate">
                    Healthcare Discovery & Transparency
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* 2. NAVIGATION LINKS LIST (Scrollable if viewport is small) */}
        {/* =================================================================== */}
        <div className="flex-1 px-2.5 py-3.5 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          
          {/* A. PRIMARY NAVIGATION SECTION */}
          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block whitespace-nowrap overflow-hidden"
                >
                  PRIMARY NAVIGATION
                </motion.span>
              )}
            </AnimatePresence>

            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) onClose();
                  }}
                  title={!isHovered ? item.name : undefined}
                  className={`relative flex items-center h-11 rounded-xl transition-all ${
                    active && item.isEmergency
                      ? 'bg-red-600 text-white font-bold shadow-md shadow-red-500/30'
                      : active
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                      : item.isEmergency
                      ? 'text-red-500 hover:text-red-600 hover:bg-red-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                  } ${isHovered ? 'px-3 gap-3 justify-start' : 'justify-center w-full'}`}
                >
                  {/* Icon Box */}
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 stroke-[2] ${
                      active 
                        ? 'text-white' 
                        : item.isEmergency 
                        ? 'text-red-500' 
                        : 'text-slate-500 group-hover:text-slate-900'
                    }`} />
                  </div>

                  {/* Label Text (Expands on Hover) */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-[13.5px] whitespace-nowrap overflow-hidden tracking-tight leading-none"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              );
            })}
          </div>

          {/* Subtle Light Divider */}
          <div className="border-t border-slate-100 mx-1" />

          {/* B. BOTTOM NAVIGATION SECTION */}
          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block whitespace-nowrap overflow-hidden"
                >
                  BOTTOM NAVIGATION
                </motion.span>
              )}
            </AnimatePresence>

            {bottomNav.map((item) => {
              const Icon = item.icon;
              const active = item.path ? isCurrentActive(item.path) : false;

              if (item.action === 'logout') {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={handleLogout}
                    title={!isHovered ? item.name : undefined}
                    className={`relative flex items-center h-11 rounded-xl transition-all cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50/80 font-semibold ${
                      isHovered ? 'px-3 gap-3 justify-start' : 'justify-center w-full'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 stroke-[2] text-red-500" />
                    </div>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="text-[13.5px] whitespace-nowrap overflow-hidden tracking-tight leading-none"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) onClose();
                  }}
                  title={!isHovered ? item.name : undefined}
                  className={`relative flex items-center h-11 rounded-xl transition-all ${
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                  } ${isHovered ? 'px-3 gap-3 justify-start' : 'justify-center w-full'}`}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 stroke-[2] ${
                      active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                    }`} />
                  </div>
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-[13.5px] whitespace-nowrap overflow-hidden tracking-tight leading-none"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              );
            })}
          </div>

        </div>

        {/* =================================================================== */}
        {/* 3. BOTTOM USER PROFILE CARD (Matches Reference Image) */}
        {/* =================================================================== */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            {/* User Circle Avatar with Initial */}
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              {displayInitial}
            </div>

            {/* User Name & Patient Account Subtitle */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col min-w-0 whitespace-nowrap overflow-hidden text-left"
                >
                  <span className="font-extrabold text-slate-900 text-xs truncate leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight mt-0.5">
                    Patient Account
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </motion.aside>
    </>
  );
}
