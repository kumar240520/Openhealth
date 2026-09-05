import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Clock, 
  ShieldCheck, 
  Zap, 
  Users, 
  ArrowRight, 
  Check 
} from 'lucide-react';
import { MagicCard } from '../ui/MagicBento';

export default function AdmissionSection({ onSelectChapter, onProtectedNavigate }) {
  const [activeStep, setActiveStep] = useState(1);
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  // Smooth GPU-accelerated parallax offsets
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const leftColY = useTransform(scrollYProgress, [0, 1], ['10px', '-10px']);
  const rightColY = useTransform(scrollYProgress, [0, 1], ['16px', '-12px']);

  const benefits = [
    {
      icon: Zap,
      title: 'Faster Check-in',
      desc: 'Reduce wait times and get to care quicker.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Reliable',
      desc: 'Encrypted verification ensures your data is protected.',
    },
    {
      icon: Clock,
      title: 'Less Waiting',
      desc: 'Streamlined process means less time in line.',
    },
    {
      icon: Users,
      title: 'Better Experience',
      desc: 'A smooth, contactless journey to admission.',
    },
  ];

  return (
    <section
      ref={targetRef}
      id="admission"
      className="landing-section min-h-screen w-full relative overflow-hidden flex items-center justify-center py-20 sm:py-24 px-4 sm:px-8 lg:px-12 select-none bg-[#050814]"
    >
      {/* Background Photo with Subtle Non-Intrusive Edge Softening */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-0 overflow-hidden will-change-transform"
      >
        <img
          src="/images/page2.png"
          alt="Hospital Reception & Smart Admission"
          className="w-full h-full object-cover object-center page-background-image filter brightness-[0.96] contrast-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030916]/80 via-[#030916]/25 to-transparent" />
        
        {/* Subtle, Compact Edge Vignettes (Preserves Full Image Visibility) */}
        <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-b from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-t from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
      </motion.div>

      {/* Main Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          
          {/* Left Column: Big Headline, Paragraph, and Full-Scale Smart Admission QR Card */}
          <motion.div 
            style={{ y: leftColY }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col gap-4 max-w-2xl will-change-transform"
          >
            
            {/* Eyebrow Pill */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold w-fit backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              SMART ADMISSION
            </motion.div>

            {/* Big Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.05] tracking-tight drop-shadow-lg"
            >
              Start Care Without <br />
              <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                the Friction.
              </span>
            </motion.h2>

            {/* Subtitle Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-100 text-sm sm:text-base max-w-xl leading-relaxed drop-shadow"
            >
              A simpler QR-based admission flow that helps patients move from reception to care with less unnecessary friction.
            </motion.p>

            {/* Full-Scale Smart Admission Glass Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="p-5 sm:p-6 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/20 shadow-2xl relative overflow-hidden group max-w-xl"
            >
              {/* Top Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/15 text-xs">
                <span className="font-mono uppercase tracking-widest text-cyan-300 font-bold text-xs">
                  SMART ADMISSION
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-500/40 backdrop-blur-md text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  READY TO START
                </span>
              </div>

              {/* Middle Section: QR Code + Verification Checklist */}
              <div className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* QR Code Container */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/[0.08] border border-white/15 relative backdrop-blur-md">
                  <div className="text-[11px] font-semibold text-slate-200 mb-2">Scan to Begin</div>
                  <div className="relative w-26 h-26 bg-white p-2 rounded-lg shadow-inner flex items-center justify-center">
                    <div className="w-full h-full bg-slate-950 rounded flex flex-col justify-between p-1 relative overflow-hidden">
                      <div className="flex justify-between">
                        <div className="w-4.5 h-4.5 border-2 border-cyan-400 p-0.5"><div className="w-full h-full bg-cyan-400"></div></div>
                        <div className="w-4.5 h-4.5 border-2 border-cyan-400 p-0.5"><div className="w-full h-full bg-cyan-400"></div></div>
                      </div>
                      <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-scan" />
                      <div className="flex justify-between items-end">
                        <div className="w-4.5 h-4.5 border-2 border-cyan-400 p-0.5"><div className="w-full h-full bg-cyan-400"></div></div>
                        <div className="w-3.5 h-3.5 bg-cyan-400/80 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Digital Admission Checklist */}
                <div className="sm:col-span-7 flex flex-col gap-2.5 text-slate-200 pl-2">
                  <div className="font-bold text-white text-sm">Secure digital admission</div>
                  <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-[13px]">
                    <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                    <span>Patient verification</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-[13px]">
                    <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                    <span>Admission details</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200 text-xs sm:text-[13px]">
                    <Check className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
                    <span>Secure check-in</span>
                  </div>
                </div>
              </div>

              {/* Bottom 3-Step Interactive Bar */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15">
                {[
                  { step: '01', title: 'SCAN', desc: 'Start admission securely.' },
                  { step: '02', title: 'VERIFY', desc: 'Confirm patient details.' },
                  { step: '03', title: 'CONTINUE', desc: 'Move to check-in.' },
                ].map((st, i) => (
                  <button
                    key={st.step}
                    onClick={() => setActiveStep(i + 1)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                      activeStep === i + 1
                        ? 'bg-cyan-500/25 border-cyan-400/60 shadow-md'
                        : 'bg-white/[0.05] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
                      <span className="text-cyan-400 font-mono">{st.step}</span>
                      <span>{st.title}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight hidden sm:block">
                      {st.desc}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Under-Card Pill Bar */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-between p-3.5 rounded-xl bg-black/45 border border-white/20 backdrop-blur-xl text-xs sm:text-sm text-slate-200 max-w-xl"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Less waiting. More time for care.</span>
              </div>
              <button 
                onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/bookings') : (onSelectChapter && onSelectChapter(4))}
                className="text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                Learn About Smart Admission
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column: 4 Cards Horizontally Aligned in One Single Row */}
          <motion.div 
            style={{ y: rightColY }}
            className="lg:col-span-6 xl:col-span-6 flex flex-col justify-end items-end w-full pb-1 will-change-transform"
          >
            <div className="w-full flex flex-col gap-3">
              {/* Header Label */}
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold drop-shadow text-left sm:text-right pr-1">
                WHY SMART ADMISSION?
              </div>

              {/* 4 Cards Arranged in One Horizontal Row with MagicCard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">
                {benefits.map((b, idx) => {
                  const Icon = b.icon;
                  return (
                    <MagicCard
                      key={b.title}
                      glowColor="34, 211, 238"
                      enableTilt={true}
                      enableMagnetism={true}
                      clickEffect={true}
                      enableBorderGlow={true}
                      className="p-3 sm:p-3.5 rounded-2xl bg-black/50 hover:bg-black/65 backdrop-blur-2xl border border-white/20 hover:border-cyan-400/50 shadow-xl transition-all cursor-pointer flex flex-col justify-between group h-full min-h-[140px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)] shrink-0">
                          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                      </div>

                      <div className="flex flex-col justify-end">
                        <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                          {b.title}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug mt-1">
                          {b.desc}
                        </p>
                      </div>
                    </MagicCard>
                  );
                })}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </section>
  );
}
