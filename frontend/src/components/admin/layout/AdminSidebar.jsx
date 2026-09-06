import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  Users,
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  Landmark, 
  HeartHandshake, 
  BarChart3, 
  ScrollText, 
  LogOut, 
  Activity,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AdminSidebar({ isOpen, onClose, isHovered: controlledHover, onHoverChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  const [internalHover, setInternalHover] = useState(false);
  const isHovered = controlledHover !== undefined ? controlledHover : internalHover;
  const setHover = (val) => {
    setInternalHover(val);
    if (onHoverChange) onHoverChange(val);
  };

  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isExpanded = isHovered || (isOpen && isMobile);

  const adminName = profile?.full_name || 'Platform Administrator';
  const displayInitial = adminName.charAt(0).toUpperCase() || 'A';

  // 9 Admin Navigation items matching Document specifications & Hospital/Patient panel style
  const primaryNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Hospitals', path: '/admin/hospitals', icon: Building2 },
    { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
    { name: 'Verification Queue', path: '/admin/verification', icon: ShieldCheck, badge: 'Live' },
    { name: 'Schemes', path: '/admin/schemes', icon: Landmark },
    { name: 'Insurance & TPA', path: '/admin/insurance', icon: HeartHandshake },
    { name: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
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
    if (itemPath === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/dashboard/admin')) return true;
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

      {/* Main Solid Light-Colored Expandable Sidebar Rail (Identical physics & styles to Hospital/Patient panel) */}
      <motion.aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        initial={false}
        animate={{
          width: isExpanded ? 260 : 72,
        }}
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30,
        }}
        style={{ willChange: 'width' }}
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/90 shadow-[4px_0_24px_rgba(0,0,0,0.06)] flex flex-col justify-between overflow-hidden select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        
        {/* =================================================================== */}
        {/* 1. TOP BRAND HEADER */}
        {/* =================================================================== */}
        <div className="h-18 px-3.5 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
          <button 
            type="button"
            onClick={() => navigate('/admin/dashboard')} 
            className="flex items-center gap-3 text-left cursor-pointer group min-w-0"
          >
            {/* Brand Logo Squircle */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>

            {/* Brand Title & Sub-headlines (Reveals on Hover / Mobile Expand) */}
            <AnimatePresence>
              {isExpanded && (
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
                    PLATFORM ADMIN
                  </span>
                  <span className="text-[8.5px] font-medium text-slate-400 tracking-tight block -mt-0.5 truncate">
                    National Health Governance
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
          
          <div className="flex flex-col gap-1">
            <AnimatePresence>
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block whitespace-nowrap overflow-hidden"
                >
                  GOVERNANCE & PLATFORM
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
                  title={!isExpanded ? item.name : undefined}
                  className={`relative flex items-center h-11 rounded-xl transition-colors ${
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
                  } ${isExpanded ? 'px-3 gap-3 justify-start' : 'justify-center w-full'}`}
                >
                  {/* Icon Box */}
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 stroke-[2] ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                  </div>

                  {/* Label Text (Expands on Hover / Mobile Expand) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center justify-between flex-1 min-w-0 whitespace-nowrap overflow-hidden"
                      >
                        <span className="text-[13.5px] whitespace-nowrap overflow-hidden font-semibold leading-none tracking-tight">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${
                            active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. BOTTOM USER & LOGOUT SECTION */}
        {/* =================================================================== */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex flex-col gap-2">
          {/* Admin Avatar card */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {displayInitial}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col min-w-0 flex-1 truncate"
                >
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {adminName}
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase truncate">
                    Master Admin
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors w-full cursor-pointer text-xs font-semibold"
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

      </motion.aside>
    </>
  );
}
