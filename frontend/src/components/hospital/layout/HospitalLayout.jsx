import React, { useState } from 'react';
import { motion } from 'framer-motion';
import HospitalSidebar from './HospitalSidebar';
import HospitalNavbar from './HospitalNavbar';
import { HospitalProvider } from '../../../context/HospitalContext';
import { Headphones } from 'lucide-react';

function HospitalLayoutInner({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
      
      {/* Fixed Left Sidebar (Spring expandable rail) */}
      <HospitalSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isHovered={sidebarHovered}
        onHoverChange={setSidebarHovered}
      />

      {/* Main Content Area (Spring animated in sync with sidebar rail, identical to AppLayout) */}
      <motion.div 
        initial={false}
        animate={{
          paddingLeft: sidebarHovered ? 260 : 72
        }}
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30
        }}
        className="flex-1 flex flex-col min-w-0 max-lg:!pl-0"
      >
        
        {/* Fixed Top Navbar */}
        <HospitalNavbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarHovered={sidebarHovered}
        />

        {/* Scrollable Page Content (Offset by 16 for fixed navbar) */}
        <div className="flex-1 pt-16 min-h-screen flex flex-col justify-between">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>

          {/* Footer on every screen matching PDF screenshots */}
          <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>© 2025 OpenHealth. All rights reserved.</span>
            <a 
              href="mailto:support@openhealth.in"
              className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <span>Need Help?</span>
              <Headphones className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact Support</span>
            </a>
          </footer>
        </div>

      </motion.div>

    </div>
  );
}

export default function HospitalLayout({ children }) {
  return (
    <HospitalProvider>
      <HospitalLayoutInner>{children}</HospitalLayoutInner>
    </HospitalProvider>
  );
}
