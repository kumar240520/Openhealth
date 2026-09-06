import React from 'react';
import { useSmoothScroll } from '../../context/SmoothScrollContext';

export default function Footer() {
  const { scrollTo } = useSmoothScroll();

  const handleScroll = (id) => {
    scrollTo(`#${id}`);
  };

  return (
    <footer className="w-full border-t border-white/10 bg-[#050814]/90 backdrop-blur-xl py-8 px-6 lg:px-12 text-xs text-slate-400">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Left Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
          <button onClick={() => handleScroll('hero')} className="hover:text-cyan-400 transition-colors cursor-pointer">Care</button>
          <button onClick={() => handleScroll('discovery')} className="hover:text-cyan-400 transition-colors cursor-pointer">Hospitals</button>
          <button onClick={() => handleScroll('discovery')} className="hover:text-cyan-400 transition-colors cursor-pointer">Doctors</button>
          <button onClick={() => handleScroll('ai-care')} className="hover:text-cyan-400 transition-colors cursor-pointer">Treatments</button>
          <button onClick={() => handleScroll('admission')} className="hover:text-cyan-400 transition-colors cursor-pointer">Schemes</button>
          <button onClick={() => handleScroll('openhealth')} className="hover:text-cyan-400 transition-colors cursor-pointer">About</button>
        </div>

        {/* Center Slogan */}
        <div className="font-medium text-slate-300 tracking-wide text-center">
          OpenHealth, Healthcare, made clearer.
        </div>

        {/* Right Legal / Contact */}
        <div className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-slate-200 transition-colors">Privacy</a>
          <a href="#terms" className="hover:text-slate-200 transition-colors">Terms</a>
          <a href="#contact" className="hover:text-slate-200 transition-colors">Contact</a>
        </div>

      </div>
    </footer>
  );
}
