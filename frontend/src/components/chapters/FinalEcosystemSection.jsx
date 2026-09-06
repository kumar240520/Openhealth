import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  FileText, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import BlurText from '../ui/BlurText';
import SpecularButton from '../ui/SpecularButton';
import { MagicCard } from '../ui/MagicBento';

export default function FinalEcosystemSection({ onSelectChapter, onProtectedNavigate }) {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  // Hardware-accelerated parallax offsets
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const topBlockY = useTransform(scrollYProgress, [0, 1], ['12px', '-10px']);
  const bottomBlockY = useTransform(scrollYProgress, [0, 1], ['16px', '-8px']);

  const handleNav = (chNum) => {
    if (onSelectChapter) onSelectChapter(chNum);
  };

  const steps = [
    {
      step: '01',
      title: 'DISCOVER',
      desc: 'Find hospitals and treatments.',
      icon: Search,
      target: 4,
    },
    {
      step: '02',
      title: 'COMPARE',
      desc: 'Compare cost, availability, and transparency.',
      icon: SlidersHorizontal,
      target: 4,
    },
    {
      step: '03',
      title: 'UNDERSTAND',
      desc: 'Understand reports and medical bills.',
      icon: FileText,
      target: 5,
    },
    {
      step: '04',
      title: 'DECIDE',
      desc: 'Make a more informed healthcare choice.',
      icon: CheckCircle2,
      target: 2,
    },
  ];

  return (
    <section
      ref={targetRef}
      id="openhealth"
      className="landing-section min-h-screen w-full relative overflow-hidden flex flex-col justify-between pt-24 pb-8 px-4 sm:px-8 lg:px-14 select-none bg-[#050814]"
    >
      {/* Background Image with Subtle Non-Intrusive Top Vignette */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-0 overflow-hidden will-change-transform"
      >
        <img
          src="/images/page6.png"
          alt="OpenHealth Healthcare Journey"
          className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.01]"
        />
        {/* Subtle dark gradient at the bottom for CTA & Footer contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        
        {/* Compact, Subtle Top Vignette */}
        <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-b from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
      </motion.div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto flex-1 flex flex-col justify-between mt-2">
        
        {/* Top & Middle Section with Smooth Parallax Drift */}
        <motion.div 
          style={{ y: topBlockY }}
          className="max-w-4xl will-change-transform"
        >
          
          {/* Top Eyebrow Tag: "OPENHEALTH" */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
            className="text-[13px] font-bold tracking-wider text-slate-900 mb-2"
          >
            OPENHEALTH
          </motion.div>

          {/* Big Headline: "One clearer healthcare journey." with BlurText animation */}
          <div className="mb-7 max-w-2xl">
            <BlurText
              text="One clearer healthcare journey."
              delay={140}
              animateBy="words"
              direction="top"
              stepDuration={0.4}
              className="text-4xl sm:text-6xl lg:text-[60px] font-extrabold text-slate-950 leading-[1.04] tracking-tight"
            />
          </div>

          {/* 4 Frosted Glass Step Cards with MagicCard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 relative z-10 mb-8 max-w-4xl">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <MagicCard
                  key={item.title}
                  glowColor="45, 212, 191"
                  enableTilt={true}
                  enableMagnetism={true}
                  clickEffect={true}
                  enableBorderGlow={true}
                  onClick={() => handleNav(item.target)}
                  className="p-4 rounded-2xl bg-white/30 hover:bg-white/45 backdrop-blur-2xl border border-white/50 hover:border-teal-400/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  {/* Card Top: Step tag & Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-900 bg-white/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/70 shadow-sm">
                      {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-teal-600/15 border border-teal-600/25 text-teal-900 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Card Content: Title & Desc */}
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-950 group-hover:text-teal-900 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-800 leading-snug mt-1 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </MagicCard>
              );
            })}
          </div>

          {/* Big Stat Counters: 500+ Hospitals, 25K+ Patients, 1,200+ Treatments */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap items-baseline gap-8 sm:gap-12 mb-6"
          >
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                500+
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">Hospitals</div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                25K+
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">Patients</div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                1,200+
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">Treatments</div>
            </div>
          </motion.div>

          {/* Feature Box: "ANALYZE YOUR BILL" Glassy Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full sm:w-[320px] p-4 rounded-2xl bg-white/35 hover:bg-white/45 backdrop-blur-2xl border border-white/55 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col gap-1.5 mb-6"
          >
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-900">
              ANALYZE YOUR BILL
            </div>
            <div className="text-[12px] text-slate-800 font-medium">
              Upload <span className="text-slate-500">→</span> OCR <span className="text-slate-500">→</span> Line Items <span className="text-slate-500">→</span> Insights
            </div>
            <button
              onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/bills') : handleNav(5)}
              className="text-[12px] font-bold text-[#096979] hover:text-[#0b8296] flex items-center gap-1 mt-0.5 cursor-pointer"
            >
              <span>Analyze Your Bill</span>
              <span>→</span>
            </button>
          </motion.div>

        </motion.div>

        {/* Lower Section: Call-To-Action & Footer Bar on Dark Forecourt with Smooth Parallax */}
        <motion.div 
          style={{ y: bottomBlockY }}
          className="flex flex-col gap-6 pt-2 will-change-transform"
        >
          
          {/* Final Call to Action Block */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-col gap-3 max-w-2xl"
          >
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                Your healthcare journey starts here.
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed drop-shadow">
                Discover the right care with information you can understand and decisions you can trust.
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/hospitals') : handleNav(4)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-teal-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Find Care</span>
                <span>→</span>
              </button>

              <SpecularButton
                onClick={() => onProtectedNavigate ? onProtectedNavigate('/dashboard/patient') : handleNav(1)}
                size="md"
                radius={20}
                tint="#0f172a"
                tintOpacity={0.8}
                textColor="#ffffff"
                lineColor="#38bdf8"
                baseColor="#334155"
                intensity={1.2}
                followMouse
                proximity={200}
                className="px-6 py-2.5 font-bold shadow-md border border-white/20"
              >
                Explore OpenHealth
              </SpecularButton>
            </div>

            {/* Quick Underlined Links with Decorative Sparkle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <button
                  onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/emergency') : handleNav(3)}
                  className="underline underline-offset-4 hover:text-white transition-colors cursor-pointer"
                >
                  Emergency Search
                </button>
                <button
                  onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/schemes') : handleNav(2)}
                  className="underline underline-offset-4 hover:text-white transition-colors cursor-pointer"
                >
                  Check Eligibility
                </button>
                <button
                  onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/bills') : handleNav(5)}
                  className="underline underline-offset-4 hover:text-white transition-colors cursor-pointer"
                >
                  Analyze Your Bill
                </button>
              </div>

              {/* Decorative 4-point sparkle icon on right */}
              <div className="text-slate-400 text-2xl select-none hidden sm:block pr-8">
                ✦
              </div>
            </div>
          </motion.div>

          {/* Slogan (Centered): "OpenHealth, Healthcare, made clearer." */}
          <div className="text-center font-bold text-white text-sm sm:text-base tracking-wide drop-shadow-md pt-2">
            OpenHealth, Healthcare, made clearer.
          </div>

          {/* Integrated Footer Bar */}
          <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-300 pt-2 border-t border-white/10">
            {/* Left Nav Links */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-slate-200">
              <button onClick={() => handleNav(1)} className="hover:text-cyan-300 transition-colors cursor-pointer">Care</button>
              <button onClick={() => handleNav(4)} className="hover:text-cyan-300 transition-colors cursor-pointer">Hospitals</button>
              <button onClick={() => handleNav(4)} className="hover:text-cyan-300 transition-colors cursor-pointer">Doctors</button>
              <button onClick={() => handleNav(5)} className="hover:text-cyan-300 transition-colors cursor-pointer">Treatments</button>
              <button onClick={() => handleNav(2)} className="hover:text-cyan-300 transition-colors cursor-pointer">Schemes</button>
              <button onClick={() => handleNav(6)} className="hover:text-cyan-300 transition-colors cursor-pointer">About</button>
            </div>

            {/* Right Legal Links */}
            <div className="flex items-center gap-5 text-slate-300">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </footer>

        </motion.div>

      </div>
    </section>
  );
}
