import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  Database, 
  Lock,
  Search,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllHospitals() {
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setHospitals(data);
        }
      } catch (err) {
        console.error('Error loading hospitals for admin:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllHospitals();
  }, []);

  const handleVerify = async (hospitalId) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ verification_status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', hospitalId);

      if (!error) {
        setHospitals(hospitals.map(h => h.id === hospitalId ? { ...h, verification_status: 'verified' } : h));
      }
    } catch (err) {
      console.error('Error approving hospital:', err);
    }
  };

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
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/40 text-rose-300 text-[11px] font-bold uppercase tracking-wider">
            Platform Master Admin
          </span>
        </div>

        {/* Admin Status & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/[0.06] border border-white/10">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">
                {profile?.full_name || 'System Admin'}
              </span>
              <span className="text-[10px] text-rose-400 font-mono uppercase">
                {profile?.role || 'platform_admin'}
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

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        
        {/* Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              National Health Authority Security Node
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Platform Master Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Authorize new hospital nodes, inspect PostgreSQL RLS policies, and manage RBAC role permissions.
            </p>
          </div>
        </section>

        {/* Hospital Approvals Table */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Hospital Node Verification & Approvals
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#080f1e]/80 shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-white/[0.04] text-slate-400 font-bold uppercase text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-5">Hospital Name</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                {hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-bold text-white">{h.name}</td>
                    <td className="py-4 px-5 text-slate-300">{h.city || 'Bangalore'}, {h.state || 'Karnataka'}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        h.verification_status === 'verified' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
                      }`}>
                        {h.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {h.verification_status !== 'verified' ? (
                        <button
                          onClick={() => handleVerify(h.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 ml-auto shadow-md transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Approve & Verify</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Active Node</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
