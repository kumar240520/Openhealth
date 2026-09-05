import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  FileText, 
  Sparkles,
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
import { useSmoothScroll } from '../../context/SmoothScrollContext';

const chapters = [
  { 
    id: 1, 
    number: '01', 
    title: 'Hospital Arrival', 
    icon: Activity,
    color: '#22d3ee', // Cyan
  },
  { 
    id: 2, 
    number: '02', 
    title: 'Smart Admission', 
    icon: ShieldCheck,
    color: '#fbbf24', // Amber
  },
  { 
    id: 3, 
    number: '03', 
    title: 'Emergency Mode', 
    icon: ShieldAlert,
    color: '#f43f5e', // Rose
  },
  { 
    id: 4, 
    number: '04', 
    title: 'Discover & Compare', 
    icon: Building2,
    color: '#34d399', // Emerald
  },
  { 
    id: 5, 
    number: '05', 
    title: 'AI Care Insights', 
    icon: FileText,
    color: '#818cf8', // Indigo
  },
  { 
    id: 6, 
    number: '06', 
    title: 'Ecosystem Journey', 
    icon: Sparkles,
    color: '#c084fc', // Purple
  },
];

export default function ScrollProgress({ activeChapter, onSelectChapter }) {
  const { scrollToChapter } = useSmoothScroll();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const handleSelect = (chId) => {
    if (onSelectChapter) {
      onSelectChapter(chId);
    } else if (scrollToChapter) {
      scrollToChapter(chId);
    }
  };

  const handleNext = () => {
    const nextCh = Math.min(6, activeChapter + 1);
    handleSelect(nextCh);
  };

  const handlePrev = () => {
    const prevCh = Math.max(1, activeChapter - 1);
    handleSelect(prevCh);
  };

  return (
    <aside
      aria-label="Expandable Chapter Navigation Rail"
      className="fixed left-2 sm:left-3 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-2 select-none"
    >
      {/* Up Quick Jump Button */}
      <button
        onClick={handlePrev}
        disabled={activeChapter === 1}
        aria-label="Previous Chapter"
        className={`w-7 h-7 rounded-xl bg-[#0a1020] text-slate-400 border border-[#1e293b] flex items-center justify-center transition-all shadow-md ${
          activeChapter === 1 
            ? 'opacity-25 cursor-not-allowed' 
            : 'hover:bg-[#131d35] hover:text-cyan-300 hover:border-cyan-500/50 hover:scale-105 cursor-pointer active:scale-95'
        }`}
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Main Solid Expandable Navigation Rail */}
      <motion.div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false);
          setHoveredId(null);
        }}
        animate={{
          width: isExpanded ? 215 : 54,
        }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 30,
        }}
        className="relative bg-[#070c18] border border-[#1e293b] rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex flex-col gap-1.5 overflow-hidden"
      >
        <LayoutGroup id="sidebarRail">
          {chapters.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChapter === ch.id;
            const isHovered = hoveredId === ch.id;

            return (
              <motion.button
                key={ch.id}
                layout
                onClick={() => handleSelect(ch.id)}
                onMouseEnter={() => setHoveredId(ch.id)}
                className={`relative w-full h-10 px-1 rounded-xl flex items-center transition-colors duration-200 cursor-pointer focus:outline-none ${
                  isActive 
                    ? 'text-white' 
                    : isHovered 
                      ? 'text-slate-200 bg-[#0f172a]' 
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Smooth Animated Active Background Slide Shift Box */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 rounded-xl bg-[#0e1c33] border pointer-events-none"
                    style={{
                      borderColor: `${ch.color}cc`,
                      boxShadow: `0 0 16px ${ch.color}45, inset 0 0 12px ${ch.color}15`,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 28,
                      mass: 0.8,
                    }}
                  />
                )}

                {/* Icon Container (Perfect 36px Centered Square) */}
                <div className="relative z-10 w-9 h-9 flex items-center justify-center shrink-0">
                  <Icon 
                    className={`w-4.5 h-4.5 transition-all duration-200 ${
                      isActive 
                        ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      color: isActive || isHovered ? ch.color : '#94a3b8'
                    }}
                  />
                </div>

                {/* Flyout Expanded Content (Page Name & Chapter Number) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="relative z-10 flex items-center gap-2 text-left overflow-hidden whitespace-nowrap pl-1.5 pr-2 min-w-0"
                    >
                      <span
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none shrink-0"
                        style={{
                          backgroundColor: `${ch.color}25`,
                          color: ch.color,
                        }}
                      >
                        {ch.number}
                      </span>
                      <span className="text-xs font-bold text-white tracking-wide truncate">
                        {ch.title}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </LayoutGroup>
      </motion.div>

      {/* Down Quick Jump Button */}
      <button
        onClick={handleNext}
        disabled={activeChapter === 6}
        aria-label="Next Chapter"
        className={`w-7 h-7 rounded-xl bg-[#0a1020] text-slate-400 border border-[#1e293b] flex items-center justify-center transition-all shadow-md ${
          activeChapter === 6 
            ? 'opacity-25 cursor-not-allowed' 
            : 'hover:bg-[#131d35] hover:text-cyan-300 hover:border-cyan-500/50 hover:scale-105 cursor-pointer active:scale-95'
        }`}
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Solid Chapter Index Badge (Expands on Hover) */}
      <motion.div
        animate={{
          width: isExpanded ? 215 : 54,
        }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 30,
        }}
        className="h-7 bg-[#070c18] border border-[#1e293b] rounded-xl px-2 flex items-center justify-center text-xs font-mono text-cyan-300 font-bold shadow-md overflow-hidden whitespace-nowrap"
      >
        {isExpanded ? (
          <span className="text-[11px] text-slate-300 font-medium">
            Chapter <span className="text-cyan-400 font-bold">0{activeChapter}</span> of 06
          </span>
        ) : (
          <span>0{activeChapter}/6</span>
        )}
      </motion.div>
    </aside>
  );
}
