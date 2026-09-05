import React, { useEffect } from 'react';
import { SmoothScrollProvider, useSmoothScroll, chapterSectionIds } from '../../context/SmoothScrollContext';
import Navbar from '../../components/layout/Navbar';
import ScrollProgress from '../../components/layout/ScrollProgress';
import SectionDivider from '../../components/layout/SectionDivider';
import HeroSection from '../../components/chapters/HeroSection';
import AdmissionSection from '../../components/chapters/AdmissionSection';
import EmergencySection from '../../components/chapters/EmergencySection';
import DiscoverySection from '../../components/chapters/DiscoverySection';
import AICareSection from '../../components/chapters/AICareSection';
import FinalEcosystemSection from '../../components/chapters/FinalEcosystemSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LandingPageInner({ onOpenAuth }) {
  const { activeChapter, setActiveChapter, scrollToChapter } = useSmoothScroll();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Centralized protected route navigator:
  // If user is authenticated -> navigates directly to app page.
  // If user is unauthenticated -> redirects directly to /login with redirect parameter.
  const handleProtectedNavigate = (targetPath) => {
    if (user) {
      navigate(targetPath);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
    }
  };

  // Active section detection synchronized with smooth scrolling
  useEffect(() => {
    const elements = chapterSectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = chapterSectionIds.indexOf(entry.target.id);
            if (index !== -1) {
              setActiveChapter(index + 1);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-25% 0px -25% 0px',
        threshold: 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [setActiveChapter]);

  return (
    <div className="relative min-h-screen bg-[#050814] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Single Persistent Global Frosted Glass Navbar */}
      <Navbar 
        activeChapter={activeChapter} 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth}
        onProtectedNavigate={handleProtectedNavigate}
      />

      {/* Side Chapter Tracker 01 / 06 */}
      <ScrollProgress 
        activeChapter={activeChapter} 
        onSelectChapter={scrollToChapter} 
      />

      {/* Chapter 01: Hospital Arrival (Page 1) */}
      <HeroSection 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth} 
        onProtectedNavigate={handleProtectedNavigate} 
      />

      {/* Blurred & Scattered Non-Solid Transition Divider */}
      <SectionDivider />

      {/* Chapter 02: Smart Admission (Page 2) */}
      <AdmissionSection 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth} 
        onProtectedNavigate={handleProtectedNavigate} 
      />

      {/* Blurred & Scattered Non-Solid Transition Divider */}
      <SectionDivider />

      {/* Chapter 03: Emergency Mode (Page 3) */}
      <EmergencySection 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth} 
        onProtectedNavigate={handleProtectedNavigate} 
      />

      {/* Blurred & Scattered Non-Solid Transition Divider */}
      <SectionDivider />

      {/* Chapter 04: Discover + Compare (Page 4) */}
      <DiscoverySection 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth} 
        onProtectedNavigate={handleProtectedNavigate} 
      />

      {/* Blurred & Scattered Non-Solid Transition Divider */}
      <SectionDivider />

      {/* Chapter 05: AI Care Insights (Page 5) */}
      <AICareSection 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth} 
        onProtectedNavigate={handleProtectedNavigate} 
      />

      {/* Blurred & Scattered Non-Solid Transition Divider */}
      <SectionDivider />

      {/* Chapter 06: Healthcare Journey & Final Ecosystem (Page 6) */}
      <FinalEcosystemSection 
        onSelectChapter={scrollToChapter} 
        onOpenAuth={onOpenAuth} 
        onProtectedNavigate={handleProtectedNavigate} 
      />
    </div>
  );
}

export default function LandingPage({ onOpenAuth }) {
  return (
    <SmoothScrollProvider>
      <LandingPageInner onOpenAuth={onOpenAuth} />
    </SmoothScrollProvider>
  );
}
