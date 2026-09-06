import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Landmark, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  Users,
  RotateCw
} from 'lucide-react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import SchemeFormModal from '../../components/admin/SchemeFormModal';
import adminService from '../../services/adminService';

export default function AdminSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSchemes = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const data = await adminService.getSchemes();
      setSchemes(data);
    } catch (e) {
      console.error('Error loading government schemes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const handleCreateOrUpdate = async (schemeData) => {
    try {
      setActionLoading(true);
      if (schemeData.id) {
        await adminService.updateScheme(schemeData.id, schemeData);
      } else {
        await adminService.createScheme(schemeData);
      }
      setIsModalOpen(false);
      setSelectedScheme(null);
      await loadSchemes(true);
    } catch (e) {
      console.error('Save scheme error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (schemeId, currentActive) => {
    try {
      setActionLoading(true);
      await adminService.toggleSchemeStatus(schemeId, !currentActive);
      await loadSchemes(true);
    } catch (e) {
      console.error('Toggle status error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (schemeId) => {
    if (!window.confirm('Are you sure you want to delete this government scheme?')) return;
    try {
      setActionLoading(true);
      await adminService.deleteScheme(schemeId);
      await loadSchemes(true);
    } catch (e) {
      console.error('Delete scheme error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSchemes = schemes.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout onRefresh={() => loadSchemes(true)} isRefreshing={refreshing}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Government Health Scheme Governance</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Configure national schemes (PM-JAY Ayushman Bharat, CGHS, State Welfare) and patient entitlement algorithms.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedScheme(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Government Scheme</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scheme name, eligibility, treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Active Programs: <strong className="text-blue-600">{schemes.filter(s => s.is_active !== false).length}</strong>
          </span>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 animate-pulse">
              Loading health schemes from Supabase PostgreSQL...
            </div>
          ) : filteredSchemes.length > 0 ? (
            filteredSchemes.map((s) => {
              const isActive = s.is_active !== false;
              const treatments = Array.isArray(s.covered_treatments) ? s.covered_treatments : [];
              const docs = Array.isArray(s.required_documents) ? s.required_documents : [];

              return (
                <motion.div
                  key={s.id}
                  whileHover={{ translateY: -2 }}
                  className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isActive ? 'Active Scheme' : 'Inactive'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight mt-1.5 line-clamp-1">
                          {s.name}
                        </h3>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {s.description || 'Comprehensive financial coverage and inpatient treatment assistance.'}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Annual Cap:</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          ₹{s.eligibility_rules?.coverage_amount || '5,00,000'} / year
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Income Cap:</span>
                        <span className="text-slate-800 font-semibold">
                          ₹{s.eligibility_rules?.income_limit || '2,50,000'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Covered Specialties:</span>
                        <span className="text-slate-800 font-medium">{treatments.length} departments</span>
                      </div>
                    </div>

                    {/* Specialties chips */}
                    <div className="flex flex-wrap gap-1">
                      {treatments.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">
                          {t}
                        </span>
                      ))}
                      {treatments.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                          +{treatments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(s.id, isActive)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        isActive 
                          ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100' 
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedScheme(s);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Edit Scheme"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Scheme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-xs text-slate-500">
              No government schemes match your query.
            </div>
          )}
        </div>

      </div>

      {/* Scheme Form Modal */}
      <SchemeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedScheme(null);
        }}
        scheme={selectedScheme}
        onSave={handleCreateOrUpdate}
        processing={actionLoading}
      />
    </AdminLayout>
  );
}
