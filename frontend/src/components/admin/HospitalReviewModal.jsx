import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  BedDouble, 
  Siren,
  FileCheck2,
  Clock
} from 'lucide-react';

export default function HospitalReviewModal({ 
  isOpen, 
  onClose, 
  hospital, 
  onApprove, 
  onReject, 
  onRequestInfo,
  onToggleSuspend,
  processing = false 
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [infoRequestText, setInfoRequestText] = useState('');
  const [activeAction, setActiveAction] = useState(null); // 'reject' | 'info' | null

  if (!isOpen || !hospital) return null;

  const isVerified = hospital.verification_status === 'verified';
  const isSuspended = hospital.is_active === false;

  const handleApprove = () => {
    if (onApprove) onApprove(hospital.id);
  };

  const handleConfirmReject = () => {
    if (onReject && rejectReason.trim()) {
      onReject(hospital.id, rejectReason.trim());
      setActiveAction(null);
      setRejectReason('');
    }
  };

  const handleConfirmRequestInfo = () => {
    if (onRequestInfo && infoRequestText.trim()) {
      onRequestInfo(hospital.id, infoRequestText.trim());
      setActiveAction(null);
      setInfoRequestText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden my-8 text-slate-900"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                {hospital.name}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  hospital.verification_status === 'verified' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : hospital.verification_status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {hospital.verification_status || 'pending'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Facility ID: <span className="font-mono text-slate-700 font-medium">{hospital.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Legal & Regulatory Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">License No.</span>
              <span className={`text-xs font-mono font-bold mt-0.5 block truncate ${hospital.license_number ? 'text-slate-900' : 'text-amber-600'}`}>
                {hospital.license_number || 'Not Provided'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tax / GSTIN</span>
              <span className={`text-xs font-mono font-bold mt-0.5 block truncate ${hospital.tax_id ? 'text-slate-900' : 'text-amber-600'}`}>
                {hospital.tax_id || 'Not Provided'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Authorized Signatory</span>
              <span className={`text-xs font-bold mt-0.5 block truncate ${hospital.signatory_name ? 'text-slate-900' : 'text-amber-600'}`}>
                {hospital.signatory_name || 'Not Specified'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">KYC Status</span>
              <span className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${
                hospital.kyc_document_url ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {hospital.kyc_document_url ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Docs Submitted</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Docs Missing</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Contact & Location Details */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Facility Address & Contact Coordinates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  {[hospital.address, hospital.city, hospital.state].filter(Boolean).join(', ') || 'Address Not Provided'}
                  {hospital.postal_code ? ` - ${hospital.postal_code}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{hospital.phone || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">{hospital.email || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                {hospital.website ? (
                  <a href={hospital.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                    {hospital.website}
                  </a>
                ) : (
                  <span className="text-slate-400">Not Provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Real KYC Documents & Certificates Check */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                Uploaded Compliance Documents & Verification Dossier
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                hospital.kyc_document_url
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {hospital.kyc_document_url ? 'Document Verified' : 'Action Required'}
              </span>
            </h3>
            
            {hospital.kyc_document_url ? (
              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-slate-900">Clinical Establishment & Accreditation Certificate</p>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Submitted
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lic. No: <span className="font-mono font-medium text-slate-700">{hospital.license_number || 'N/A'}</span> • GSTIN: <span className="font-mono font-medium text-slate-700">{hospital.tax_id || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <a 
                  href={hospital.kyc_document_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  title="Open / Download Document"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View / Download Document</span>
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-rose-900">No KYC Document Submitted</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    This hospital has not yet attached their official Clinical Establishment License or Regulatory Certificate. Please request documentation before verifying.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sub-actions: Rejection reason or Information request form */}
          {activeAction === 'reject' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3"
            >
              <span className="text-xs font-bold text-rose-800 block">
                Specify Reason for Registration Rejection:
              </span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Expired clinical establishment license, invalid signatory authority, missing GSTIN..."
                rows={3}
                className="w-full p-3 rounded-xl bg-white border border-rose-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || processing}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          )}

          {activeAction === 'info' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3"
            >
              <span className="text-xs font-bold text-amber-800 block">
                Message to Hospital Administrator (Requesting Clarification):
              </span>
              <textarea
                value={infoRequestText}
                onChange={(e) => setInfoRequestText(e.target.value)}
                placeholder="e.g. Please upload an updated copy of the Fire Safety NOC and clarify emergency ICU bed count..."
                rows={3}
                className="w-full p-3 rounded-xl bg-white border border-amber-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActiveAction(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRequestInfo}
                  disabled={!infoRequestText.trim() || processing}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-xs"
                >
                  Dispatch Request
                </button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {onToggleSuspend && (
              <button
                onClick={() => onToggleSuspend(hospital.id, !isSuspended)}
                disabled={processing}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isSuspended 
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isSuspended ? 'Reactivate Facility' : 'Suspend Facility'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Request info trigger */}
            <button
              onClick={() => setActiveAction(activeAction === 'info' ? null : 'info')}
              disabled={processing}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Request Info</span>
            </button>

            {/* Reject trigger */}
            {!isVerified && (
              <button
                onClick={() => setActiveAction(activeAction === 'reject' ? null : 'reject')}
                disabled={processing}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}

            {/* Approve trigger */}
            <button
              onClick={handleApprove}
              disabled={processing || isVerified}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all ${
                isVerified 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isVerified ? 'Facility Verified' : 'Approve & Verify'}</span>
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
