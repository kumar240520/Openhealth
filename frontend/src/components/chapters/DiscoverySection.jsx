import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Search, 
  ShieldCheck, 
  Shield, 
  ArrowRight, 
  IndianRupee 
} from 'lucide-react';

export default function DiscoverySection({ onSelectChapter, onProtectedNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  // Hardware-accelerated parallax offsets
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const rightColY = useTransform(scrollYProgress, [0, 1], ['14px', '-12px']);

  const handleNav = (chNum) => {
    if (onSelectChapter) onSelectChapter(chNum);
  };

  return (
    <section
      ref={targetRef}
      id="discovery"
      className="landing-section min-h-screen w-full relative overflow-hidden flex items-center justify-center py-20 sm:py-24 px-4 sm:px-6 lg:pl-4 lg:pr-8 xl:pr-14 select-none bg-[#050814]"
    >
      {/* Background Photo with Subtle Non-Intrusive Edge Softening */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-0 overflow-hidden will-change-transform"
      >
        <img
          src="/images/page4.webp"
          alt="Healthcare Discovery and Comparison"
          className="w-full h-full object-cover object-left md:object-center page-background-image filter brightness-[0.96] contrast-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050c12]/65" />
        
        {/* Subtle, Compact Edge Vignettes (Preserves Full Image Visibility) */}
        <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-b from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-t from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
      </motion.div>

      <div className="relative z-10 w-full max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 items-center">
        
        {/* Expanded Left Column Spacer (Clear framing for phone & middle cards) */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-7" />

        {/* Right Column: Shifted to the Far Right End with Smooth Parallax Drift */}
        <motion.div 
          style={{ y: rightColY }}
          className="lg:col-span-6 xl:col-span-5 flex flex-col gap-3.5 lg:pl-2 xl:pl-6 max-w-xl lg:ml-auto mr-0 will-change-transform"
        >
          
          {/* Eyebrow Tag: "DISCOVER + COMPARE" */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
            className="text-xs sm:text-[13px] font-bold tracking-wider text-[#4fd1c5] font-mono uppercase"
          >
            DISCOVER + COMPARE
          </motion.div>

          {/* Main Headline: "Don't Just Find a Hospital. Find the Right One." */}
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-white leading-[1.08] tracking-tight drop-shadow-md"
          >
            Don't Just Find a Hospital. <br />
            Find the <span className="text-[#5eead4]">Right One.</span>
          </motion.h2>

          {/* Subtitle / Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-slate-300 text-xs sm:text-sm lg:text-[14px] font-normal leading-relaxed"
          >
            Don't settle for the first option you find. Compare hospitals using ratings, transparency, availability, distance, cost and coverage.
          </motion.p>

          {/* Search Input Bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative w-full pt-0.5"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search hospitals, treatments or care"
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-black/45 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#4fd1c5] focus:ring-1 focus:ring-[#4fd1c5] transition-all backdrop-blur-xl shadow-lg"
              />
            </div>
          </motion.div>

          {/* "TOP MATCHES FOR YOU" Header & Toggle Switch */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-between pt-1 text-xs"
          >
            <span className="font-mono uppercase tracking-wider text-slate-300 font-bold text-[11px]">
              TOP MATCHES FOR YOU
            </span>

            {/* Verified Only Toggle with Shield Icon */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none"
            >
              <div className="flex items-center gap-1 text-[#5eead4] font-medium text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Only</span>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                  verifiedOnly ? 'bg-[#14b8a6]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    verifiedOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </motion.div>

          {/* Hospital Comparison Cards (2 Cards) */}
          <div className="flex flex-col gap-2.5">
            
            {/* Match Card 1: City Care Hospital (94% MATCH) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="p-3 sm:p-3.5 rounded-2xl bg-[#0e171f]/85 hover:bg-[#121d26]/90 backdrop-blur-xl border border-white/15 hover:border-[#4fd1c5]/50 shadow-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {/* 94% Match Badge & Image Thumbnail */}
                <div className="relative shrink-0">
                  <span className="absolute -top-2 -left-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-slate-950 text-[9px] font-extrabold uppercase shadow-sm">
                    94% MATCH
                  </span>
                  <img
                    src="/images/page1.jpeg"
                    alt="City Care Hospital"
                    className="w-13 h-11 rounded-xl object-cover border border-white/20 mt-1"
                  />
                </div>

                {/* Info */}
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    City Care Hospital
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                      ★ 4.8
                    </span>
                    <span>• 2.4 km</span>
                    <span>• 3 ICU</span>
                    <span className="text-[#5eead4] font-semibold flex items-center gap-0.5">
                      Verified ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Availability & Cost Pill */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">3 ICU Available</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[#5eead4] font-bold text-xs mt-0.5 shadow-sm">
                    <IndianRupee className="w-3 h-3 text-emerald-400" />
                    <span>₹1.8L – ₹2.4L</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Match Card 2: Metro Health (89% MATCH) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-3 sm:p-3.5 rounded-2xl bg-[#0e171f]/85 hover:bg-[#121d26]/90 backdrop-blur-xl border border-white/15 hover:border-[#4fd1c5]/50 shadow-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {/* 89% Match Badge & Image Thumbnail */}
                <div className="relative shrink-0">
                  <span className="absolute -top-2 -left-1 px-1.5 py-0.5 rounded bg-[#06b6d4] text-slate-950 text-[9px] font-extrabold uppercase shadow-sm">
                    89% MATCH
                  </span>
                  <img
                    src="/images/page6.png"
                    alt="Metro Health"
                    className="w-13 h-11 rounded-xl object-cover border border-white/20 mt-1"
                  />
                </div>

                {/* Info */}
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Metro Health
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 mt-0.5">
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                      ★ 4.6
                    </span>
                    <span>• 6.8 km</span>
                    <span>• 1 ICU</span>
                    <span className="text-[#5eead4] font-semibold flex items-center gap-0.5">
                      Verified ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Availability & Cost Pill */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">3 ICU Available</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[#5eead4] font-bold text-xs mt-0.5 shadow-sm">
                    <IndianRupee className="w-3 h-3 text-emerald-400" />
                    <span>₹1.7L – ₹2.2L</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Transparency & Trust Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="p-3 rounded-2xl bg-[#0e171f]/80 backdrop-blur-xl border border-white/15 shadow-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-[#5eead4] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(94,234,212,0.3)]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400">Transparency You Can Trust</div>
                <div className="font-extrabold text-white text-xs sm:text-sm tracking-tight">91/100</div>
              </div>
            </div>

            <div className="text-center">
              <div className="font-extrabold text-white text-xs sm:text-sm">3 ICU</div>
              <div className="text-[10px] text-slate-400">Available</div>
            </div>

            <div className="text-center">
              <div className="font-extrabold text-white text-xs sm:text-sm">2.4 km</div>
              <div className="text-[10px] text-slate-400">Distance</div>
            </div>

            <div className="text-right">
              <div className="font-extrabold text-white text-xs sm:text-sm">₹1.8L - ₹2.4L</div>
              <div className="text-[10px] text-slate-400">Est. Cost</div>
            </div>
          </motion.div>

          {/* All Hospitals Verified Trust Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5eead4] shrink-0" />
            <span>All hospitals are verified for quality, safety and transparency.</span>
          </div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-3 pt-0.5"
          >
            <button 
              onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/hospitals') : handleNav(5)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Explore Hospitals</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/hospitals') : handleNav(5)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-2xl bg-black/45 hover:bg-black/65 text-[#5eead4] text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-xl transition-all cursor-pointer"
            >
              <span>Compare Now</span>
              <ArrowRight className="w-4 h-4 text-[#5eead4]" />
            </button>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}
