import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ScrollText, 
  Search, 
  Filter, 
  Clock, 
  User, 
  ShieldCheck, 
  Eye, 
  Download, 
  RotateCw,
  Database,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import AuditDetailModal from '../../components/admin/AuditDetailModal';
import adminService from '../../services/adminService';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const data = await adminService.getAuditLogs({
        action: actionFilter,
        entity: entityFilter,
        query: searchQuery
      });
      setLogs(data);
    } catch (e) {
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actionFilter, entityFilter, searchQuery]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `openhealth_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeStyle = (action) => {
    if (action.includes('VERIF')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (action.includes('ROLE') || action.includes('STATUS')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-rose-50 text-rose-700 border border-rose-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  };

  return (
    <AdminLayout onRefresh={() => loadAuditLogs(true)} isRefreshing={refreshing}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Security Audit Stream & Compliance</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Cryptographically verified audit trail capturing clinical state changes, credential approvals, and RBAC privilege modifications.
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Action Types</option>
              <option value="HOSPITAL_VERIFIED">Hospital Verified</option>
              <option value="DOCTOR_VERIFIED">Doctor Verified</option>
              <option value="USER_ROLE_CHANGED">Role Changed</option>
              <option value="USER_STATUS_TOGGLED">Status Toggled</option>
              <option value="SCHEME_CREATED">Scheme Created</option>
              <option value="INSURANCE_PROVIDER_CREATED">Insurance Created</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Entity Types</option>
              <option value="hospital">Hospital</option>
              <option value="doctor">Doctor</option>
              <option value="profile">User Profile</option>
              <option value="government_schemes">Scheme</option>
              <option value="insurance_providers">Insurance</option>
            </select>
          </div>

        </div>

        {/* Audit Logs Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200/80 tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Actor Account</th>
                  <th className="py-3.5 px-5">Target Entity</th>
                  <th className="py-3.5 px-5">IP Origin</th>
                  <th className="py-3.5 px-5 text-right">Payload Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">
                      Loading audit event streams from Supabase PostgreSQL...
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {(log.profiles?.full_name || 'A').charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block truncate">
                              {log.profiles?.full_name || 'Platform Admin'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {log.profiles?.email || 'platform.admin@openhealth.org'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div>
                          <span className="font-mono text-blue-600 font-bold block uppercase text-[11px]">
                            {log.entity_type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.entity_id ? log.entity_id.slice(0, 8) + '...' : 'System Node'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono text-slate-600 text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 space-y-2">
                      <Database className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-xs text-slate-800">No Audit Events Recorded Yet</p>
                      <p className="text-[11px] text-slate-500">Administrative and operational actions will record compliance events automatically.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </AdminLayout>
  );
}
