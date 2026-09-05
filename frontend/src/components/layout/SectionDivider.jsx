import React from 'react';

export default function SectionDivider() {
  return (
    <div className="relative w-full h-24 sm:h-36 -my-12 sm:-my-16 overflow-hidden pointer-events-none z-[6] flex items-center justify-center select-none">
      {/* Heavy Multi-Stage Frosted Blur & Gradient Dissolve */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050814]/75 to-transparent backdrop-blur-3xl" />

      {/* Highly Scattered Ambient Diffusion Orbs */}
      <div className="absolute w-3/4 h-20 -top-6 bg-cyan-500/10 rounded-full blur-[48px] mix-blend-screen" />
      <div className="absolute w-2/3 h-20 -bottom-6 bg-teal-500/10 rounded-full blur-[48px] mix-blend-screen" />
      
      {/* Central Soft Dark Ambient Core */}
      <div className="absolute w-full h-12 bg-gradient-to-r from-transparent via-[#050814]/90 to-transparent blur-xl" />
    </div>
  );
}
