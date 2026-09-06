import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Radio, 
  CheckCircle2, 
  MapPin, 
  ArrowRight 
} from 'lucide-react';
import SpecularButton from '../ui/SpecularButton';

export default function EmergencySection({ onSelectChapter, onProtectedNavigate }) {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  // Hardware-accelerated parallax offsets
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const leftColY = useTransform(scrollYProgress, [0, 1], ['12px', '-12px']);
  const cardY = useTransform(scrollYProgress, [0, 1], ['18px', '-14px']);

  const handleNav = (chNum) => {
    if (onSelectChapter) onSelectChapter(chNum);
  };

  return (
    <section
      ref={targetRef}
      id="emergency"
      className="landing-section min-h-screen w-full relative overflow-hidden flex items-center justify-center py-20 sm:py-24 px-4 sm:px-8 lg:px-14 select-none bg-[#050814]"
    >
      {/* Background Photo with Subtle Non-Intrusive Edge Softening */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-0 overflow-hidden will-change-transform"
      >
        <img
          src="/images/page3.jpeg"
          alt="Emergency Ambulance and Trauma Center"
          className="w-full h-full object-cover object-center page-background-image filter brightness-[0.96] contrast-[1.02]"
        />
        {/* Soft edge gradients for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/30" />
        
        {/* Subtle, Compact Edge Vignettes (Preserves Full Image Visibility) */}
        <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-b from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-t from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
      </motion.div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Headline, Copy, and Bottom-Left Telemetry Pills */}
        <motion.div 
          style={{ y: leftColY }}
          className="lg:col-span-7 flex flex-col justify-between h-full py-4 max-w-2xl will-change-transform"
        >
          <div>
            {/* Red Eyebrow Badge: "EMERGENCY MODE" */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="px-3.5 py-1.5 rounded-lg bg-[#e13b3b] text-white text-xs font-bold uppercase tracking-wider w-fit shadow-md mb-4"
            >
              EMERGENCY MODE
            </motion.div>

            {/* Big Headline: "When Every Second Matters." */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-white leading-[1.05] tracking-tight mb-4 drop-shadow-md"
            >
              When Every Second <br />
              Matters.
            </motion.h2>

            {/* Subtitle / Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-100 text-sm sm:text-base max-w-lg leading-relaxed drop-shadow"
            >
              Find nearby emergency facilities using availability, distance, and verified facility information.
            </motion.p>
          </div>

          {/* 3 Bottom-Left Frosted Glass Pills (LIVE, VERIFIED, NEARBY) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-3 pt-10 sm:pt-14"
          >
            {/* Pill 1: LIVE Availability */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/45 backdrop-blur-2xl border border-white/20 shadow-xl">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
              <div>
                <div className="text-xs font-bold text-white tracking-wide">LIVE</div>
                <div className="text-[11px] text-slate-300">Availability</div>
              </div>
            </div>

            {/* Pill 2: VERIFIED Facility */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/45 backdrop-blur-2xl border border-white/20 shadow-xl">
              <CheckCircle2 className="w-5 h-5 text-[#5eead4] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white tracking-wide">VERIFIED</div>
                <div className="text-[11px] text-slate-300">Facility</div>
              </div>
            </div>

            {/* Pill 3: NEARBY 2.4 km */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/45 backdrop-blur-2xl border border-white/20 shadow-xl">
              <MapPin className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white tracking-wide">NEARBY</div>
                <div className="text-[11px] text-slate-300">2.4 km</div>
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Right Column: Active Emergency Facility Card & Bottom Actions */}
        <motion.div 
          style={{ y: cardY }}
          className="lg:col-span-5 flex flex-col items-center lg:items-end will-change-transform"
        >
          
          {/* Main Emergency Facility Frosted Glass Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full max-w-[420px] p-6 rounded-[28px] bg-[#0c181e]/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col gap-4"
          >
            {/* Top Box: EMERGENCY MODE ACTIVE (with Glowing Red Light) */}
            <div className="p-4 rounded-2xl bg-[#1c0f12]/90 border border-rose-500/30 flex flex-col items-center justify-center gap-1 shadow-inner">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-semibold">
                EMERGENCY MODE
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#f87171] shadow-[0_0_15px_#ef4444] animate-pulse" />
                <span className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Nearest Facility Info */}
            <div className="pt-1 flex flex-col gap-1">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                NEAREST SUITABLE FACILITY
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                City Hospital
              </h3>
              <div className="text-xs sm:text-sm text-slate-300">
                2.4 km away
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#5eead4] flex items-center gap-1 mt-0.5">
                <span>Verified</span>
                <span>✓</span>
              </div>
            </div>

            {/* Telemetry Progress Bars (ICU, Emergency Care, Beds) */}
            <div className="space-y-3 pt-2">
              
              {/* Row 1: ICU & Emergency Care */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <div className="text-xs font-bold text-white">ICU</div>
                  <div className="text-[11px] text-slate-300">3 Available</div>
                </div>
                <div className="col-span-7 flex flex-col gap-1">
                  <div className="text-[11px] text-slate-200 text-right font-medium">Emergency Care</div>
                  <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden">
                    <div className="w-[50%] h-full bg-gradient-to-r from-teal-400 to-[#5eead4] rounded-full shadow-[0_0_8px_#5eead4]" />
                  </div>
                </div>
              </div>

              {/* Row 2: Beds & Full Width Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Beds</span>
                  <span className="text-slate-300 text-[11px]">12 Available</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden">
                  <div className="w-[72%] h-full bg-gradient-to-r from-teal-400 to-[#5eead4] rounded-full shadow-[0_0_8px_#5eead4]" />
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-[11px] text-slate-400 pt-1">
                Updated 2 min ago
              </div>
            </div>

          </motion.div>

          {/* Action Buttons Row & Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="w-full max-w-[420px] flex flex-col gap-3 mt-4"
          >
            {/* Buttons Row with SpecularButton */}
            <div className="grid grid-cols-2 gap-3 relative">
              <SpecularButton
                size="md"
                radius={14}
                tint="#0d9488"
                tintOpacity={0.95}
                textColor="#ffffff"
                lineColor="#5eead4"
                baseColor="#115e59"
                intensity={1.2}
                followMouse
                proximity={200}
                onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/emergency') : handleNav(4)}
                className="w-full font-bold shadow-lg shadow-teal-950/40"
              >
                <span>Get Directions</span>
                <span>→</span>
              </SpecularButton>

              <SpecularButton
                size="md"
                radius={14}
                tint="#0f172a"
                tintOpacity={0.8}
                textColor="#5eead4"
                lineColor="#5eead4"
                baseColor="#334155"
                intensity={1}
                followMouse
                proximity={200}
                onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/hospitals') : handleNav(4)}
                className="w-full font-bold border border-white/20"
              >
                <span>View Facility</span>
                <span>→</span>
              </SpecularButton>

              {/* Decorative Sparkle Diamond Icon Above Right Button */}
              <div className="absolute -top-3.5 right-6 text-slate-400 text-sm select-none pointer-events-none">
                ✦
              </div>
            </div>

            {/* Slogan Text Below Buttons */}
            <div className="text-center text-xs sm:text-sm text-slate-200 font-medium drop-shadow pt-1">
              Find care when time matters most.
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}
