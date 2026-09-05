import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  FileCheck2,
  TrendingUp,
  X,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import hospitalPortalService from '../../services/hospitalPortalService';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalTransparency() {
  const navigate = useNavigate();
  const { activeHospitalId, activeHospital } = useHospital();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionModal, setActionModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadTransparency = async () => {
    try {
      setLoading(true);
      const res = await hospitalPortalService.getTransparency(activeHospitalId);
      setData(res);
    } catch (err) {
      console.warn('Failed to load transparency:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransparency();
  }, [activeHospitalId]);

  // Realtime Supabase CDC for transparency updates
  useEffect(() => {
    if (!activeHospitalId) return;

    const channel = supabase
      .channel(`hospital-transparency-live-${activeHospitalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transparency_scores', filter: `hospital_id=eq.${activeHospitalId}` },
        () => {
          loadTransparency();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospitals', filter: `id=eq.${activeHospitalId}` },
        () => {
          loadTransparency();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeHospitalId]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await hospitalPortalService.recalculateTransparency(activeHospitalId);
      showToast(res.message || 'Transparency scorecard recalculated from live database!');
      if (res.data) {
        setData(res.data);
      } else {
        await loadTransparency();
      }
    } catch (err) {
      showToast('Failed to recalculate transparency: ' + (err.message || 'Error'));
    } finally {
      setRecalculating(false);
    }
  };

  const handleActionClick = (sug) => {
    setActionModal(sug);
  };

  // Helper to render circular progress gauge
  const renderRadialGauge = (score, color = '#0d9488', size = 84, strokeWidth = 7) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-base font-extrabold text-slate-900 leading-none">{score}</span>
          <span className="text-[9px] font-bold text-slate-400">/ 100</span>
        </div>
      </div>
    );
  };

  return (
    <HospitalLayout>
      <div className="space-y-6">
        
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-xl border border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transparency Scorecard</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Audited
              </span>
            </div>
            <p className="text-sm text-slate-500">
              OpenHealth transparency rating measuring pricing honesty, package clarity, and clinical freshness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-emerald-600' : ''}`} />
              {recalculating ? 'Auditing...' : 'Recalculate Score'}
            </button>
            <button
              onClick={() => showToast('Opening OpenHealth Transparency Standards manual...')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Audit Methodology
            </button>
          </div>
        </div>

        {/* Hero Scorecard Banner (Matches PDF Page 10) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-slate-700/60 overflow-hidden relative">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left Col: Giant Score Display */}
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {data?.status || 'Above average transparency'}
              </div>

              <div className="flex items-baseline gap-3">
                <h2 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-mono">
                  {data?.overallScore || 88}
                </h2>
                <span className="text-2xl font-bold text-slate-400">/ 100</span>
              </div>

              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                {activeHospital?.name || 'Your hospital'} maintains superior score metrics across published bed rates, verified doctor qualifications, and treatment bundle breakdown.
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Last Audited: {data?.lastUpdated || '15 May 2025, 10:30 AM'}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Top 8% in Indore Region</span>
              </div>
            </div>

            {/* Right Col: Trust Seal & Badges */}
            <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">OpenHealth Gold Verified</h4>
                  <p className="text-xs text-slate-400">Zero hidden surcharges guarantee</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>NABH Accreditation</span>
                  <span className="text-emerald-400 font-semibold">Verified ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Price Match Policy</span>
                  <span className="text-emerald-400 font-semibold">100% Bound</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Live Bed Telemetry</span>
                  <span className="text-emerald-400 font-semibold">Active</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 6 Circular Radial Breakdown Gauges (Matches PDF Page 10) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Scorecard Dimensions</h3>
            <span className="text-xs text-slate-500">6 weighted metrics calculated weekly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(data?.breakdown || []).map((item, index) => {
              const isExcellent = item.rating.toLowerCase() === 'excellent';
              const ringColor = isExcellent ? '#0d9488' : '#f59e0b';
              const badgeClass = isExcellent 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div 
                  key={index}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow"
                >
                  {/* Circular Gauge */}
                  {renderRadialGauge(item.score, ringColor, 80, 6)}

                  <div className="space-y-1 w-full">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {item.name}
                    </h4>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                      {item.rating}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Actionable Improvement Recommendation Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Actionable Improvement Checklist</h3>
              <p className="text-xs text-slate-500">Targeted actions to boost your hospital score above 95</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              5 Recommendations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.suggestions || []).map((sug) => {
              const isHighImpact = sug.impact.toLowerCase().includes('high');
              return (
                <div 
                  key={sug.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isHighImpact 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {sug.impact}
                      </span>
                      <Zap className={`w-4 h-4 ${isHighImpact ? 'text-blue-500' : 'text-amber-500'}`} />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {sug.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sug.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleActionClick(sug)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-blue-200 transition-all group"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Actionable Modal */}
        <AnimatePresence>
          {actionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{actionModal.title}</h3>
                  </div>
                  <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <p>{actionModal.desc}</p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-semibold text-slate-800 block mb-1">Recommended Resolution:</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Review latest billing logs against catalog item rates.</li>
                      <li>Publish complete line-item breakdown for surgical items.</li>
                      <li>Submit supporting declaration with 1-click verification.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setActionModal(null);
                      showToast(`Resolution workflow initiated for: ${actionModal.title}`);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                  >
                    Initiate Workflow
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </HospitalLayout>
  );
}
