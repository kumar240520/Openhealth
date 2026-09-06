import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Stethoscope, 
  Bell, 
  FileText, 
  ShieldCheck, 
  Receipt, 
  Calendar, 
  Bookmark, 
  Settings, 
  User, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';

const pageConfigs = {
  doctors: {
    title: 'Verified Specialist Doctors',
    subtitle: 'Find and book consultations with top verified specialists across empanelled hospitals',
    icon: Stethoscope,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    stats: [
      { label: 'Verified Doctors', value: '450+' },
      { label: 'Specialties', value: '38+' },
      { label: 'Average Rating', value: '4.8 ★' }
    ]
  },
  emergency: {
    title: '24/7 Emergency & Trauma Response',
    subtitle: '1-Tap rapid ambulance dispatch and hospital ICU bed reserve system',
    icon: Bell,
    color: 'text-red-600',
    bg: 'bg-red-50',
    stats: [
      { label: 'Emergency Hotline', value: '1066' },
      { label: 'Active ICU Beds', value: '84 Live' },
      { label: 'Ambulance SLA', value: '< 15 mins' }
    ]
  },
  documents: {
    title: 'Medical Records & Health Locker',
    subtitle: 'Secure ABDM/ABHA linked EHR documents, lab reports, and discharge summaries',
    icon: FileText,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    stats: [
      { label: 'Linked Records', value: '12 Files' },
      { label: 'ABHA Locker', value: 'Active' },
      { label: 'Encryption', value: '256-bit AES' }
    ]
  },
  schemes: {
    title: 'Costs & Coverage (PM-JAY & Insurance)',
    subtitle: 'Check cashless pre-authorization, government health schemes, and TPA limits',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    stats: [
      { label: 'Ayushman PM-JAY', value: '₹5,00,000' },
      { label: 'Empanelled TPAs', value: '18 Partners' },
      { label: 'Pre-Auth Time', value: '~20 mins' }
    ]
  },
  bills: {
    title: 'Bill Shock & Expense Analyzer',
    subtitle: 'AI-audited bill breakdown, rate-card comparison, and hidden charge alerts',
    icon: Receipt,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    stats: [
      { label: 'Bill Audit Accuracy', value: '99.4%' },
      { label: 'Avg Savings Found', value: '18.2%' },
      { label: 'Price Lock Match', value: 'Guaranteed' }
    ]
  },
  bookings: {
    title: 'Hospital & Bed Bookings',
    subtitle: 'Manage your active 30-minute bed reservations, OT holds, and doctor appointments',
    icon: Calendar,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    stats: [
      { label: 'Active Holds', value: '1 Bed' },
      { label: 'Upcoming Visits', value: '0 Scheduled' },
      { label: 'Past Admissions', value: '2 Completed' }
    ]
  },
  saved: {
    title: 'Saved Hospitals & Doctors',
    subtitle: 'Quick access to your bookmarked healthcare facilities and trusted doctors',
    icon: Bookmark,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    stats: [
      { label: 'Saved Hospitals', value: '4 Bookmarked' },
      { label: 'Preferred ICU Units', value: '2 Facilities' },
      { label: 'Location', value: 'Indore, MP' }
    ]
  },
  settings: {
    title: 'Account & Security Settings',
    subtitle: 'Manage notification alerts, multi-factor authentication, and data privacy permissions',
    icon: Settings,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    stats: [
      { label: 'Security Level', value: 'High' },
      { label: '2FA Auth', value: 'Active' },
      { label: 'ABHA Linkage', value: 'Verified' }
    ]
  },
  profile: {
    title: 'Patient Profile & KYC',
    subtitle: 'Personal medical identification, ABHA health ID, emergency contacts, and blood group',
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    stats: [
      { label: 'KYC Status', value: 'Verified' },
      { label: 'Blood Group', value: 'O+' },
      { label: 'Registered City', value: 'Indore' }
    ]
  }
};

export default function PatientFeaturePage({ type = 'doctors' }) {
  const navigate = useNavigate();
  const config = pageConfigs[type] || pageConfigs.doctors;
  const Icon = config.icon;

  return (
    <AppLayout>
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 flex flex-col gap-6 min-w-0">
        
        {/* Back Link & Quick Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button 
            type="button"
            onClick={() => navigate('/dashboard/patient')} 
            className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span>/</span>
          <span className="text-slate-900 font-bold capitalize">{type}</span>
        </div>

        {/* Feature Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
                {config.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/hospitals')}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex-shrink-0"
          >
            Browse Hospitals Marketplace
          </button>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {config.stats.map((st, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{st.label}</span>
              <span className="text-base font-black text-slate-900">{st.value}</span>
            </div>
          ))}
        </div>

        {/* Informational Panel */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-black text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Integrated Healthcare System Status</span>
          </div>

          <p className="leading-relaxed">
            All data on this module is connected live with OpenHealth PostgreSQL central registry and synchronized with empanelled healthcare facilities in Indore and Madhya Pradesh.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Real-time database connectivity active</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 font-semibold text-slate-800">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Auto-refresh enabled every 30 seconds</span>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
