import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AppSidebar from './AppSidebar';
import AppNavbar from './AppNavbar';

import { AIFindCareProvider } from '../../context/AIFindCareContext';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <AIFindCareProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex">
        
        {/* Fixed Left Sidebar */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isHovered={sidebarHovered}
          onHoverChange={setSidebarHovered}
        />

        {/* Main Content Area (Spring animated in sync with sidebar rail) */}
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
          <AppNavbar 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isSidebarHovered={sidebarHovered}
          />

          {/* Scrollable Page Content (Offset by 16 for fixed navbar) */}
          <div className="flex-1 pt-16 min-h-screen">
            {children}
          </div>

        </motion.div>

      </div>
    </AIFindCareProvider>
  );
}
