import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import RotatingText from '../ui/RotatingText';

export default function AICareSection({ onSelectChapter, onProtectedNavigate }) {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  // Hardware-accelerated parallax offsets
  const bgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['14px', '-12px']);

  return (
    <section
      ref={targetRef}
      id="ai-care"
      className="landing-section min-h-screen w-full relative overflow-hidden flex items-center py-20 sm:py-24 px-4 sm:px-8 lg:px-14 xl:px-20 select-none bg-[#050814]"
    >
      {/* Background Photo with Subtle Non-Intrusive Edge Softening */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-0 overflow-hidden will-change-transform"
      >
        <img
          src="/images/page5.webp"
          alt="AI Healthcare Guidance and Care Insights"
          className="w-full h-full object-cover object-left md:object-center filter brightness-[0.95] contrast-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#070e14]/65" />
        
        {/* Subtle, Compact Edge Vignettes (Preserves Full Image Visibility) */}
        <div className="absolute top-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-b from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-24 bg-gradient-to-t from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
      </motion.div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* Left Column Spacer (Framing the person on the left) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-6" />

        {/* Right Column: Shifted to the right side with Smooth Parallax Drift */}
        <motion.div 
          style={{ y: contentY }}
          className="lg:col-span-7 xl:col-span-6 flex flex-col gap-6 lg:pl-10 xl:pl-14 max-w-2xl lg:ml-auto will-change-transform"
        >
          
          {/* Eyebrow Header: "AI CARE INSIGHTS ●" */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-sm font-semibold tracking-wider text-[#4fd1c5]"
          >
            <span>AI CARE INSIGHTS</span>
            <span className="w-2 h-2 rounded-full bg-[#4fd1c5] shadow-[0_0_10px_#4fd1c5]" />
          </motion.div>

          {/* Main Headline: "Make Sense of Your Healthcare Options." with RotatingText */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-white leading-[1.08] tracking-tight"
          >
            Make Sense of Your <br />
            Healthcare{' '}
            <RotatingText
              texts={['Options.', 'Costs.', 'Reports.', 'Bills.', 'Choices.']}
              mainClassName="text-[#5eead4] inline-flex overflow-hidden"
              staggerFrom="last"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-120%', opacity: 0 }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2200}
            />
          </motion.h2>

          {/* Subtitle / Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-[15px] max-w-xl font-normal leading-relaxed"
          >
            OpenHealth brings treatment options, hospital information, cost, coverage and eligibility together to help you make a more informed healthcare decision.
          </motion.p>

          {/* Interactive Cards & Visual Connecting Spline Area */}
          <div className="relative pt-2 flex flex-col gap-6">
            
            {/* SVG Connecting Curved Spline Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden sm:block"
              style={{ overflow: 'visible' }}
            >
              <path
                d="M 460 78 C 460 120, 30 75, 0 135"
                fill="none"
                stroke="#4fd1c5"
                strokeWidth="1.5"
                strokeOpacity="0.75"
                strokeDasharray="4 3"
                className="drop-shadow-[0_0_6px_#4fd1c5]"
              />
            </svg>

            {/* Top Card: "AI CARE MATCH" (Card 1) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative z-10 sm:self-end w-full sm:w-[380px] p-4 rounded-xl bg-[#121c24]/85 backdrop-blur-xl border border-white/10 shadow-2xl overflow-visible"
            >
              {/* Vertical Glowing Teal Indicator Pill on Left Edge */}
              <div className="absolute left-2.5 top-3.5 bottom-3.5 w-1 rounded-full bg-[#5eead4] shadow-[0_0_10px_#5eead4]" />

              <div className="pl-3.5">
                {/* Header Label: ✦ AI CARE MATCH */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold tracking-wider text-slate-300">
                  <span className="text-[#5eead4] text-xs">✦</span>
                  <span>AI CARE MATCH</span>
                </div>

                {/* Subtitle & Main Title Row */}
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      Recommended Treatment Path
                    </div>
                    <div className="text-base font-bold text-white mt-0.5 tracking-tight">
                      Orthopedic Evaluation
                    </div>
                  </div>

                  {/* 94% relevance tag */}
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap mb-0.5">
                    94% relevance
                  </span>
                </div>
              </div>

              {/* Connecting Dot at bottom of Card 1 */}
              <div className="absolute -bottom-1.5 right-6 w-2.5 h-2.5 rounded-full bg-[#4fd1c5] shadow-[0_0_8px_#4fd1c5] hidden sm:block" />
            </motion.div>

            {/* Bottom Card: "HOSPITAL MATCH" & 3-Column Metrics (Card 2) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 25 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative z-10 w-full p-5 sm:p-6 rounded-2xl bg-[#121c24]/85 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-5"
            >
              {/* Connecting Node on Left Edge of Card 2 */}
              <div className="absolute -left-1.5 top-8 w-2.5 h-2.5 rounded-full bg-[#4fd1c5] shadow-[0_0_8px_#4fd1c5] hidden sm:block" />

              {/* Top Hospital Match Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10 text-xs">
                {/* Left: Hospital Name */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    HOSPITAL MATCH
                  </span>
                  <span className="text-sm font-bold text-white tracking-wide">
                    CITY CARE HOSPITAL
                  </span>
                </div>

                {/* Right: Rating, Transparency Score & Verified Status */}
                <div className="flex items-center gap-3 text-slate-300 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-white">4.8</span>
                    <span className="text-amber-400">★</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>91/100 Transparency</span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1 text-slate-200">
                    <Check className="w-3.5 h-3.5 text-[#5eead4]" />
                    Verified
                  </span>
                </div>
              </div>

              {/* 3-Column Metrics Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 text-xs">
                
                {/* Column 1: GOVERNMENT SCHEME */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    <Check className="w-3 h-3 text-[#5eead4]" />
                    GOVERNMENT SCHEME
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-3.5 rounded-full bg-[#5eead4] shadow-[0_0_8px_#5eead4]" />
                    <span className="text-sm font-bold text-white">Potentially Eligible</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Based on eligibility criteria.
                  </p>
                </div>

                {/* Column 2: ESTIMATED COST */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    ESTIMATED COST
                  </div>
                  <div className="text-xl font-bold text-white mt-0.5 tracking-tight">
                    ₹1.8L – ₹2.4L
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Estimated range before admission.
                  </p>
                </div>

                {/* Column 3: INSURANCE */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider">
                    INSURANCE
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-white mt-0.5 flex items-center gap-1">
                    <span>Potential coverage identified</span>
                    <Check className="w-3.5 h-3.5 text-[#5eead4] shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Check your coverage before treatment.
                  </p>
                </div>

              </div>
            </motion.div>
          </div>

          {/* Bottom Slogan & CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="pt-2 flex flex-col items-center gap-3.5"
          >
            {/* Slogan with Decorative 4-point Sparkle */}
            <div className="relative flex items-center justify-center w-full">
              <p className="text-center text-sm font-medium text-slate-200">
                From information overload to informed decisions.
              </p>
              <div className="absolute right-2 text-slate-500 text-lg select-none hidden sm:block">
                ✦
              </div>
            </div>

            {/* Glowing Pill Action Button: "Get Your Care Match →" */}
            <button
              onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/ai-analyzer') : (onSelectChapter && onSelectChapter(6))}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-teal-900/40 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Get Your Care Match</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
