import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  Menu, 
  X,
  LogIn,
  UserPlus,
  User,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmoothScroll } from '../../context/SmoothScrollContext';
import { useAuth } from '../../context/AuthContext';
import { getRoleDashboardPath } from '../auth/ProtectedRoute';

export default function Navbar({ activeChapter, onSelectChapter, onOpenAuth, onProtectedNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollToChapter } = useSmoothScroll();
  const navigate = useNavigate ? useNavigate() : null;
  const { user, profile, signOut } = useAuth();

  const handleNavClick = (chapterNum) => {
    if (onSelectChapter) {
      onSelectChapter(chapterNum);
    } else if (scrollToChapter) {
      scrollToChapter(chapterNum);
    }
    setMobileMenuOpen(false);
  };

  const handleAuthClick = (mode) => {
    setMobileMenuOpen(false);
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else if (navigate) {
      navigate(mode === 'signup' ? '/signup' : '/login');
    }
  };

  const mobileNavLinks = [
    { name: '01 Hospital Arrival', target: 1 },
    { name: '02 Smart Admission & Schemes', target: 2 },
    { name: '03 Emergency Mode', target: 3 },
    { name: '04 Discover & Compare', target: 4 },
    { name: '05 AI Care Insights', target: 5 },
    { name: '06 Ecosystem', target: 6 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-3.5 sm:py-5 px-4 sm:px-8 lg:px-12 pointer-events-none select-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        
        {/* Left: Solid High-Contrast Brand Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-auto"
        >
          <button
            onClick={() => handleNavClick(1)}
            className="flex items-center gap-3 px-4.5 py-2.5 rounded-2xl bg-[#070c18] border border-[#1e293b] shadow-[0_10px_25px_rgba(0,0,0,0.8)] group focus:outline-none cursor-pointer hover:border-cyan-400/80 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-300 flex items-center justify-center shadow-md shadow-cyan-500/40 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              OpenHealth
            </span>
          </button>
        </motion.div>

        {/* Right: Action Buttons (Emergency, User / Login, Sign Up) */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="hidden sm:flex items-center gap-3 pointer-events-auto"
        >
          {/* Solid 1-Tap Emergency Dispatch Button (Larger & Solid Red/Crimson) */}
          <button
            onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/emergency') : handleNavClick(3)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-extrabold bg-[#dc2626] hover:bg-[#ef4444] text-white border border-rose-400 shadow-[0_8px_25px_rgba(220,38,38,0.45)] hover:shadow-[0_12px_30px_rgba(220,38,38,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4.5 h-4.5 text-white animate-pulse" />
            <span>Emergency</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(getRoleDashboardPath(profile?.role || 'patient'))}
                title="Go to your Dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-md transition-all cursor-pointer group"
              >
                <User className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {profile?.role || 'patient'}
                </span>
              </button>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-2xl bg-[#0f172a] hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-[#334155] hover:border-red-500/50 transition-all cursor-pointer shadow-md"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Solid Login Button (Larger & Solid Dark Slate) */}
              <button
                onClick={() => handleAuthClick('login')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] hover:border-cyan-400/80 shadow-[0_6px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-4.5 h-4.5 text-cyan-400" />
                <span>Login</span>
              </button>

              {/* Solid Sign Up Button (Larger & Solid Luminous Emerald Gradient) */}
              <button
                onClick={() => handleAuthClick('signup')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm sm:text-[15px] font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 hover:from-emerald-300 hover:to-cyan-200 text-slate-950 tracking-wide shadow-[0_8px_25px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_35px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>Sign Up</span>
              </button>
            </>
          )}
        </motion.div>

        {/* Mobile Hamburger Menu Button */}
        <div className="sm:hidden pointer-events-auto">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-2xl bg-[#070c18] border border-[#1e293b] text-slate-200 hover:text-white shadow-lg focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden mx-2 mt-2 p-5 rounded-2xl bg-[#070c18] border border-[#1e293b] shadow-2xl flex flex-col gap-3 pointer-events-auto"
          >
            {mobileNavLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.target)}
                className="text-left text-sm font-medium text-slate-200 hover:text-cyan-400 py-2 transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ))}
            <div className="pt-3 border-t border-[#1e293b] flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onProtectedNavigate) onProtectedNavigate('/app/emergency');
                  else handleNavClick(3);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold bg-[#dc2626] text-white shadow-lg shadow-rose-600/30"
              >
                <ShieldAlert className="w-4.5 h-4.5 text-white animate-pulse" />
                <span>Emergency Mode</span>
              </button>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => handleAuthClick('login')}
                  className="flex-1 py-3 text-center text-sm font-bold text-white rounded-xl bg-[#0f172a] border border-[#334155] cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => handleAuthClick('signup')}
                  className="flex-1 py-3 text-center text-sm font-black bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 rounded-xl cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
