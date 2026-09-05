import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Truck, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  LogOut, 
  Search,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProviderDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('claims');

  const claims = [
    { id: 'CLM-8921', patient: 'Aarav Sharma', scheme: 'PM-JAY Scheme', hospital: 'Apollo Super Speciality', amount: 45000, status: 'Pending Review' },
    { id: 'CLM-8922', patient: 'Priya Verma', scheme: 'Star Health Comprehensive', hospital: 'Fortis Memorial', amount: 120000, status: 'Approved' },
    { id: 'CLM-8923', patient: 'Rajesh Nair', scheme: 'Ayushman Bharat', hospital: 'Manipal Hospital', amount: 28000, status: 'Pre-Authorized' },
  ];

  const ambulances = [
    { id: 'AMB-108-A', driver: 'Vikram Singh', location: 'Koramangala, Bangalore', status: 'Available', eta: '4 mins' },
    { id: 'AMB-108-B', driver: 'Sunil Kumar', location: 'Indiranagar, Bangalore', status: 'En Route to Apollo', eta: '8 mins' },
    { id: 'AMB-108-C', driver: 'Amit Patel', location: 'Whitefield, Bangalore', status: 'On Emergency Call', eta: '12 mins' },
  ];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#070c18]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-300 flex items-center justify-center shadow-md shadow-cyan-500/30 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
            <span className="font-black text-lg text-white tracking-tight">OpenHealth</span>
          </button>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-[11px] font-bold uppercase tracking-wider">
            Provider & Claims Hub
          </span>
        </div>

        {/* User & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/[0.06] border border-white/10">
            <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">
                {profile?.full_name || 'Organization Provider'}
              </span>
              <span className="text-[10px] text-teal-300 font-mono uppercase">
                {profile?.role || 'insurance_user'}
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            title="Sign Out"
            className="p-2 rounded-2xl bg-white/[0.06] hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-300 transition-all cursor-pointer shadow-md"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        
        {/* Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-950 border border-teal-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Adjudication & Emergency Fleet Network
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Healthcare Provider Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Real-time government scheme verifications, direct hospital bill settlements, and GPS ambulance fleet dispatch.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/50 border border-white/10">
              <button
                onClick={() => setActiveTab('claims')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'claims' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Insurance Claims
              </button>
              <button
                onClick={() => setActiveTab('ambulances')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ambulances' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ambulance Fleet
              </button>
            </div>
          </div>
        </section>

        {/* Content Section */}
        {activeTab === 'claims' ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              Live Insurance & Government Scheme Claims
            </h2>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#080f1e]/80 shadow-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/[0.04] text-slate-400 font-bold uppercase text-[11px] border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-5">Claim ID</th>
                    <th className="py-3.5 px-5">Patient Name</th>
                    <th className="py-3.5 px-5">Scheme / Policy</th>
                    <th className="py-3.5 px-5">Hospital</th>
                    <th className="py-3.5 px-5 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-teal-300">{c.id}</td>
                      <td className="py-4 px-5 font-bold text-white">{c.patient}</td>
                      <td className="py-4 px-5 text-slate-300">{c.scheme}</td>
                      <td className="py-4 px-5 text-slate-400">{c.hospital}</td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-white">₹{c.amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' :
                          c.status === 'Pending Review' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-400" />
              Active Ambulance Fleet Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ambulances.map((amb) => (
                <div key={amb.id} className="p-5 rounded-2xl bg-[#080f1e]/90 border border-white/10 flex flex-col justify-between gap-4 shadow-xl">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-400 text-sm">{amb.id}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                        {amb.status}
                      </span>
                    </div>
                    <span className="font-bold text-white text-base">{amb.driver}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {amb.location}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Response ETA</span>
                    <span className="font-bold font-mono text-emerald-300">{amb.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
