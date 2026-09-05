import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Building2, 
  Activity, 
  IndianRupee, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  PlusCircle,
  Sparkles 
} from 'lucide-react';
import TextType from '../ui/TextType';
import SpecularButton from '../ui/SpecularButton';
import { MagicCard } from '../ui/MagicBento';

export default function HeroSection({ onSelectChapter, onOpenAuth, onProtectedNavigate }) {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start'],
  });

  // Hardware-accelerated parallax transforms
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.06]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);
  const ribbonY = useTransform(scrollYProgress, [0, 1], ['0%', '5%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);

  const cards = [
    {
      num: '01',
      icon: Building2,
      title: 'Hospital Discovery',
      tag: 'Find suitable hospitals',
      color: 'text-cyan-300',
      glowColor: '34, 211, 238',
      hoverBorder: 'hover:border-cyan-400/80',
      target: 4,
    },
    {
      num: '02',
      icon: Activity,
      title: 'Live Availability',
      tag: 'Check beds and ICU live',
      color: 'text-emerald-300',
      glowColor: '52, 211, 153',
      hoverBorder: 'hover:border-emerald-400/80',
      target: 3,
    },
    {
      num: '03',
      icon: IndianRupee,
      title: 'Cost Intelligence',
      tag: 'Compare treatment costs',
      color: 'text-amber-300',
      glowColor: '251, 191, 36',
      hoverBorder: 'hover:border-amber-400/80',
      target: 4,
    },
    {
      num: '04',
      icon: FileText,
      title: 'AI Insights',
      tag: 'Smart report breakdown',
      color: 'text-indigo-300',
      glowColor: '129, 140, 248',
      hoverBorder: 'hover:border-indigo-400/80',
      target: 5,
    },
    {
      num: '05',
      icon: ShieldCheck,
      title: 'Scheme Coverage',
      tag: 'AB-PMJAY & Insurance',
      color: 'text-teal-300',
      glowColor: '45, 212, 191',
      hoverBorder: 'hover:border-teal-400/80',
      target: 2,
    },
  ];

  const handleCardClick = (chNum) => {
    if (onSelectChapter) onSelectChapter(chNum);
  };

  return (
    <section
      ref={targetRef}
      id="hero"
      className="landing-section min-h-screen w-full relative overflow-hidden flex flex-col justify-between pt-24 pb-6 px-4 sm:px-8 lg:px-14 select-none bg-[#050814]"
    >
      {/* Background Photo with Subtle, Non-Intrusive Edge Vignette */}
      <motion.div 
        style={{ y: bgY, scale: bgScale }}
        className="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] z-0 overflow-hidden will-change-transform"
      >
        <img
          src="/images/page1.jpeg"
          alt="City Hospital Exterior"
          className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.05]"
        />
        {/* Soft directional shade for text readability without darkening the whole image */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/75 via-[#030712]/35 to-transparent" />
        
        {/* Compact, Subtle Edge Softening (Reduced Height) */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#050814]/80 via-[#050814]/30 to-transparent pointer-events-none z-[2]" />
        <div className="absolute bottom-0 inset-x-0 h-24 sm:h-28 bg-gradient-to-t from-[#050814]/85 via-[#050814]/35 to-transparent pointer-events-none z-[2]" />
      </motion.div>

      {/* Main Hero Copy Layer */}
      <motion.div 
        style={{ y: textY, opacity: contentOpacity }}
        className="relative z-10 max-w-3xl pt-6 my-auto will-change-transform"
      >
        {/* Monospace Eyebrow Badge with Glowing Cyan Accent */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2.5 mb-3"
        >
          <span className="px-3 py-1 rounded-full bg-cyan-500/25 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,211,238,0.35)] backdrop-blur-md">
            OPENHEALTH
          </span>
          <span className="h-px w-10 bg-gradient-to-r from-cyan-400/80 to-transparent"></span>
        </motion.div>

        {/* Hero Title: Crisp Brilliant White & Dynamic TextType Typing Animation */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-[60px] font-extrabold tracking-tight text-white leading-[1.08] mb-3.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] min-h-[130px] sm:min-h-[140px] lg:min-h-[145px]"
        >
          Find the Right Care.{' '}
          <span className="block bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.35)]">
            <TextType
              as="span"
              text={[
                'Know What to Expect.',
                'Compare Hospital Costs.',
                'Check Live ICU Beds.',
                'AI-Powered Care Insights.',
                'Transparent Healthcare.'
              ]}
              typingSpeed={65}
              deletingSpeed={35}
              pauseDuration={1800}
              showCursor={true}
              cursorCharacter="|"
              cursorClassName="text-cyan-300 font-normal ml-0.5"
            />
          </span>
        </motion.h1>

        {/* Subtitle with High-Contrast Color Accents */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-slate-100 text-sm sm:text-base lg:text-[17px] max-w-xl font-medium leading-relaxed mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
        >
          Find suitable hospitals, understand <span className="text-emerald-300 font-semibold">treatment costs</span>, check available <span className="text-cyan-300 font-semibold">live beds</span>, and make more informed healthcare decisions with AI-powered insights.
        </motion.p>

        {/* Action Buttons Row with SpecularButton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center gap-4 mb-3"
        >
          {/* Radiant Specular Primary Button */}
          <SpecularButton
            size="lg"
            radius={20}
            tint="#06b6d4"
            tintOpacity={0.9}
            textColor="#020617"
            lineColor="#67e8f9"
            baseColor="#0891b2"
            intensity={1.2}
            shineSize={12}
            shineFade={45}
            thickness={1.5}
            followMouse
            proximity={250}
            onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/hospitals') : handleCardClick(4)}
            className="shadow-[0_0_25px_rgba(34,211,238,0.45)] hover:shadow-[0_0_35px_rgba(34,211,238,0.7)] font-black text-slate-950"
          >
            <span>Find Care</span>
            <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
          </SpecularButton>

          {/* Specular Secondary Button */}
          <SpecularButton
            size="lg"
            radius={20}
            tint="#0f172a"
            tintOpacity={0.7}
            textColor="#ffffff"
            lineColor="#ffffff"
            baseColor="#334155"
            intensity={0.9}
            thickness={1}
            followMouse
            proximity={250}
            onClick={() => onProtectedNavigate ? onProtectedNavigate('/dashboard/patient') : handleCardClick(6)}
            className="border border-white/20 font-bold"
          >
            Explore OpenHealth
          </SpecularButton>
        </motion.div>

        {/* Vivid Emergency Bed Search Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <button
            onClick={() => onProtectedNavigate ? onProtectedNavigate('/app/emergency') : handleCardClick(3)}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/70 text-rose-100 text-xs sm:text-sm font-bold backdrop-blur-xl shadow-[0_0_18px_rgba(244,63,94,0.35)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:border-rose-300 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>+ Emergency Bed Search</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Floating Bottom Ribbon */}
      <motion.div
        style={{ y: ribbonY }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55 }}
        className="relative z-10 w-full max-w-7xl mx-auto mt-4 mb-1 will-change-transform"
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white drop-shadow mb-2 px-1">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Everything you need to make a better healthcare decision.</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3.5 sm:p-4 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/25 shadow-[0_15px_45px_rgba(0,0,0,0.6)]">
          {cards.map((item, idx) => {
            const Icon = item.icon;
            const targetRoute = [
              '/app/hospitals',
              '/app/hospitals',
              '/app/bills',
              '/app/schemes',
              '/app/ai-analyzer'
            ][idx] || '/app/hospitals';

            return (
              <MagicCard
                key={item.num}
                glowColor={item.glowColor}
                enableTilt={true}
                enableMagnetism={true}
                clickEffect={true}
                enableBorderGlow={true}
                onClick={() => onProtectedNavigate ? onProtectedNavigate(targetRoute) : handleCardClick(item.target)}
                className={`p-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 ${item.hoverBorder} backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold text-white/90 bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                    {item.num}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-black/40 border border-white/15 ${item.color} shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-xs sm:text-[13px] text-white tracking-tight leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium mt-0.5 truncate leading-tight">
                    {item.tag}
                  </p>
                </div>
              </MagicCard>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
