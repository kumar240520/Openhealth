import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { ShieldCheck, Headphones } from 'lucide-react';

export default function AdminLayout({ children, onRefresh, isRefreshing = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Fixed Expandable Sidebar Rail (72px collapsed, 260px expanded on hover) */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isHovered={sidebarHovered}
        onHoverChange={setSidebarHovered}
      />

      {/* Main Content Area */}
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
        style={{ willChange: 'padding-left' }}
        className="flex-1 flex flex-col min-w-0 max-lg:!pl-0"
      >
        
        {/* Fixed Top Admin Navbar */}
        <AdminNavbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarHovered={sidebarHovered}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Page Content Container */}
        <div className="flex-1 pt-16 min-h-screen flex flex-col justify-between">
          <div className="p-4 sm:p-6 lg:p-8 xl:px-10 2xl:px-12 w-full max-w-[1720px] mx-auto min-w-0">
            {children}
          </div>

          {/* Admin Footer */}
          <footer className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-600">OpenHealth Platform Administration • National Healthcare Registry Node</span>
            </div>
            <div className="flex items-center gap-4">
              <span>v2.4.0 (Central Node)</span>
              <a 
                href="mailto:support@openhealth.in"
                className="text-blue-600 hover:text-blue-700 transition-colors font-semibold flex items-center gap-1"
              >
                <span>Need Help? Contact Support</span>
              </a>
            </div>
          </footer>
        </div>

      </motion.div>

    </div>
  );
}
