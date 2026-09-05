import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  Building2, 
  BedDouble,
  Stethoscope, 
  Layers,
  FileSpreadsheet,
  Package,
  Calendar,
  CalendarClock, 
  BarChart3,
  ShieldCheck,
  Settings, 
  User, 
  LogOut, 
  Activity,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useHospital } from '../../../context/HospitalContext';

export default function HospitalSidebar({ isOpen, onClose, isHovered: controlledHover, onHoverChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { activeHospital } = useHospital();
  
  // Expand on Hover state (matching AppSidebar spring effect from patient panel)
  const [internalHover, setInternalHover] = useState(false);
  const isHovered = controlledHover !== undefined ? controlledHover : internalHover;
  const setHover = (val) => {
    setInternalHover(val);
    if (onHoverChange) onHoverChange(val);
  };

  // Hospital Navigation matching Pages 1-10 in reference PDF + Appointments
  const primaryNav = [
    { name: 'Dashboard', path: '/hospital/dashboard', icon: LayoutDashboard },
    { name: 'Hospital Profile', path: '/hospital/profile', icon: Building2 },
    { name: 'Beds', path: '/hospital/beds', icon: BedDouble },
    { name: 'Doctors', path: '/hospital/doctors', icon: Stethoscope },
    { name: 'Departments', path: '/hospital/departments', icon: Layers },
    { name: 'Treatments', path: '/hospital/treatments', icon: FileSpreadsheet },
    { name: 'Packages', path: '/hospital/packages', icon: Package },
    { name: 'Bookings', path: '/hospital/bookings', icon: Calendar },
    { name: 'Appointments', path: '/hospital/appointments', icon: CalendarClock },
    { name: 'Analytics', path: '/hospital/analytics', icon: BarChart3 },
    { name: 'Transparency', path: '/hospital/transparency', icon: ShieldCheck },
  ];

  const bottomNav = [
    { name: 'Settings', path: '/hospital/settings', icon: Settings },
    { name: 'Profile', path: '/hospital/profile', icon: User },
    { name: 'Logout', action: 'logout', icon: LogOut, isLogout: true },
  ];

  const handleLogout = async () => {
    try {
      if (signOut) await signOut();
      navigate('/login');
    } catch (err) {
      console.warn('Logout error:', err);
      navigate('/login');
    }
  };

  const isCurrentActive = (itemPath) => {
    if (!itemPath) return false;
    if (location.pathname === itemPath) return true;
    if (itemPath === '/hospital/dashboard' && (location.pathname === '/hospital' || location.pathname === '/dashboard/hospital')) return true;
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

      {/* Main Solid Light-Colored Expandable Sidebar Rail (Identical physics to AppSidebar) */}
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
            onClick={() => navigate('/hospital/dashboard')} 
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
                  <span className="text-[9px] font-black text-blue-600 tracking-wider uppercase block mt-0.5">
                    HOSPITAL PORTAL
                  </span>
                  <span className="text-[8.5px] font-medium text-slate-400 tracking-tight block -mt-0.5 truncate">
                    {activeHospital?.name || 'Operations Command Center'}
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
        {/* 2. NAVIGATION LINKS LIST */}
        {/* =================================================================== */}
        <div className="flex-1 px-2.5 py-3.5 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          
          {/* PRIMARY NAVIGATION SECTION */}
          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block whitespace-nowrap overflow-hidden"
                >
                  OPERATIONS & ADMIN
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
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                  } ${isHovered ? 'px-3 gap-3 justify-start' : 'justify-center w-full'}`}
                >
                  {/* Icon Box */}
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 stroke-[2] ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
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

        </div>

        {/* =================================================================== */}
        {/* 3. BOTTOM ACTIONS & LOGOUT */}
        {/* =================================================================== */}
        <div className="p-2.5 border-t border-slate-100 bg-white flex flex-col gap-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item.path);

            if (item.isLogout) {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={handleLogout}
                  title={!isHovered ? item.name : undefined}
                  className={`flex items-center h-10 rounded-xl transition-all text-rose-600 hover:bg-rose-50/80 font-semibold cursor-pointer ${
                    isHovered ? 'px-3 gap-3 justify-start' : 'justify-center w-full'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-rose-500 stroke-[2]" />
                  </div>
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-[13px] whitespace-nowrap overflow-hidden leading-none"
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
                title={!isHovered ? item.name : undefined}
                className={`flex items-center h-10 rounded-xl transition-all ${
                  active
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                } ${isHovered ? 'px-3 gap-3 justify-start' : 'justify-center w-full'}`}
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 stroke-[2] ${active ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-[13px] whitespace-nowrap overflow-hidden leading-none"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}

          {/* Footer Copyright revealed when hovered */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-2 px-2 text-[9px] text-slate-400 border-t border-slate-100 text-center select-none"
              >
                © 2025 OpenHealth. All rights reserved.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.aside>
    </>
  );
}
