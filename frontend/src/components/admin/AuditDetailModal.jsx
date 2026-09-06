import React from 'react';
import { motion } from 'framer-motion';
import { X, ScrollText, User, ShieldCheck, Clock, Globe, Database } from 'lucide-react';

export default function AuditDetailModal({ isOpen, onClose, log }) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-8 text-xs text-slate-900"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                Audit Event Details
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold">
                  {log.action}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">UUID: {log.id}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Key metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                Timestamp
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 mt-1 block">
                {new Date(log.created_at || Date.now()).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-600" />
                Actor Role
              </span>
              <span className="text-xs font-bold text-emerald-700 mt-1 block uppercase font-mono">
                {log.profiles?.role || log.actor_role || 'platform_admin'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
                <Globe className="w-3 h-3 text-purple-600" />
                IP Origin
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
                {log.ip_address || '127.0.0.1 (Loopback/TLS)'}
              </span>
            </div>
          </div>

          {/* Actor & Target Entity */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Actor Account:</span>
              <span className="text-slate-900 font-bold">{log.profiles?.full_name || 'System / Platform Admin'} ({log.profiles?.email || 'platform.admin@openhealth.org'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Target Entity Type:</span>
              <span className="text-blue-600 font-mono font-bold uppercase">{log.entity_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Target Entity UUID:</span>
              <span className="text-slate-700 font-mono">{log.entity_id || 'N/A'}</span>
            </div>
          </div>

          {/* Metadata JSON diff */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              Event Payload & State Mutation Diff
            </span>
            <pre className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-xs">
              {JSON.stringify(log.metadata || {}, null, 2)}
            </pre>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </motion.div>
    </div>
  );
}
