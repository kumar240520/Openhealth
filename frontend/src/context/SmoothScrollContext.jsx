import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export const chapterSectionIds = [
  'hero',        // Chapter 1: Hospital Arrival
  'admission',   // Chapter 2: Smart Admission
  'emergency',   // Chapter 3: Emergency Mode
  'discovery',   // Chapter 4: Discover + Compare
  'ai-care',     // Chapter 5: AI Care Insights
  'openhealth',  // Chapter 6: Healthcare Journey & Final Ecosystem
];

const SmoothScrollContext = createContext({
  lenis: null,
  scrollTo: () => {},
  scrollToChapter: () => {},
  scrollProgress: 0,
  activeChapter: 1,
  setActiveChapter: () => {},
});

export function SmoothScrollProvider({ children }) {
  const [lenis, setLenis] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(1);
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis with crisp responsiveness, natural scroll distance, and smooth landing
    const lenisInstance = new Lenis({
      duration: 1.1, // Fast and responsive travel with smooth landing
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential deceleration curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1, // Healthy, natural scroll distance per wheel/trackpad stroke
      touchMultiplier: 1.5, // Natural touch drag sensitivity
      syncTouch: false, // Prevents artificial sluggish drag on trackpads and mobile
      infinite: false, // Standard natural page bounds
    });

    lenisRef.current = lenisInstance;
    setLenis(lenisInstance);

    // High refresh rate Animation Frame loop (60Hz / 120Hz / 144Hz displays)
    let rafId;
    function updateRaf(time) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(updateRaf);
    }
    rafId = requestAnimationFrame(updateRaf);

    // Synchronize scroll progress
    const onScroll = (e) => {
      setScrollProgress(e.progress);
    };
    lenisInstance.on('scroll', onScroll);

    return () => {
      cancelAnimationFrame(rafId);
      lenisInstance.off('scroll', onScroll);
      lenisInstance.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target, options = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options,
      });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToChapter = useCallback((chNum, options = {}) => {
    const targetId = chapterSectionIds[chNum - 1] || 'hero';
    scrollTo(`#${targetId}`, options);
  }, [scrollTo]);

  return (
    <SmoothScrollContext.Provider
      value={{
        lenis,
        scrollTo,
        scrollToChapter,
        scrollProgress,
        activeChapter,
        setActiveChapter,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}

export const useSmoothScroll = () => useContext(SmoothScrollContext);
