import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Phone, 
  Globe, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Building2,
  RotateCw
} from 'lucide-react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import InsuranceFormModal from '../../components/admin/InsuranceFormModal';
import adminService from '../../services/adminService';

export default function AdminInsurance() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProviders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const data = await adminService.getInsuranceProviders();
      setProviders(data);
    } catch (e) {
      console.error('Error loading insurance providers:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleCreateOrUpdate = async (providerData) => {
    try {
      setActionLoading(true);
      if (providerData.id) {
        await adminService.updateInsuranceProvider(providerData.id, providerData);
      } else {
        await adminService.createInsuranceProvider(providerData);
      }
      setIsModalOpen(false);
      setSelectedProvider(null);
      await loadProviders(true);
    } catch (e) {
      console.error('Save insurance provider error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (providerId, currentActive) => {
    try {
      setActionLoading(true);
      await adminService.toggleInsuranceStatus(providerId, !currentActive);
      await loadProviders(true);
    } catch (e) {
      console.error('Toggle status error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (providerId) => {
    if (!window.confirm('Are you sure you want to remove this insurance provider?')) return;
    try {
      setActionLoading(true);
      await adminService.deleteInsuranceProvider(providerId);
      await loadProviders(true);
    } catch (e) {
      console.error('Delete insurance error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout onRefresh={() => loadProviders(true)} isRefreshing={refreshing}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Insurance & TPA Cashless Network Administration</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Maintain insurance provider affiliations, emergency cashless desks, and pre-authorization coordination.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedProvider(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Insurance Provider</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search insurance provider name, helpline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Active Insurers: <strong className="text-blue-600">{providers.filter(p => p.is_active !== false).length}</strong>
          </span>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 animate-pulse">
              Loading insurance providers from Supabase PostgreSQL...
            </div>
          ) : filteredProviders.length > 0 ? (
            filteredProviders.map((p) => {
              const isActive = p.is_active !== false;

              return (
                <motion.div
                  key={p.id}
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
                          {isActive ? 'Cashless Active' : 'Inactive'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight mt-1.5 truncate">
                          {p.name}
                        </h3>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {p.description || 'Pre-authorized cashless claims across participating hospital networks.'}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="font-mono text-slate-900 font-bold">{p.phone || '1800 425 2255'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Globe className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <a 
                          href={p.website || '#'} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline text-blue-600 font-semibold truncate"
                        >
                          {p.website || 'https://openhealth.org'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(p.id, isActive)}
                      disabled={actionLoading}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
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
                          setSelectedProvider(p);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Edit Provider"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Remove Provider"
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
              No insurance providers found.
            </div>
          )}
        </div>

      </div>

      {/* Insurance Form Modal */}
      <InsuranceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProvider(null);
        }}
        provider={selectedProvider}
        onSave={handleCreateOrUpdate}
        processing={actionLoading}
      />
    </AdminLayout>
  );
}
