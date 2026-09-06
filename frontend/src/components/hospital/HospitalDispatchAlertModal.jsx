import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  FileText, 
  Clock, 
  Building2, 
  ArrowRight, 
  ShieldAlert,
  BellRing
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';

export default function HospitalDispatchAlertModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeHospital, refreshHospital } = useHospital();

  const [activeNotice, setActiveNotice] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  // 1. Fetch unread admin dispatch notifications
  const checkDispatchedNotices = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'admin_dispatch')
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const notif = data[0];
        const dismissedKey = `openhealth_dismissed_dispatch_${notif.id}`;
        if (!sessionStorage.getItem(dismissedKey)) {
          setActiveNotice(notif);
          setIsOpen(true);
          return;
        }
      }

      // Fallback: If hospital has verification_notes and verification_status is pending/rejected, and not yet dismissed this session
      if (activeHospital?.verification_notes && activeHospital?.verification_status !== 'verified') {
        const dismissedHospNote = `openhealth_dismissed_note_${activeHospital.id}_${activeHospital.verification_notes.slice(0, 15)}`;
        if (!sessionStorage.getItem(dismissedHospNote)) {
          setActiveNotice({
            id: `fallback-hosp-note-${activeHospital.id}`,
            title: `Action Required: Platform Compliance Review`,
            message: activeHospital.verification_notes,
            created_at: activeHospital.updated_at || new Date().toISOString(),
            isFallback: true
          });
          setIsOpen(true);
        }
      }
    } catch (err) {
      console.warn('Failed to check dispatch notices:', err);
    }
  };

  useEffect(() => {
    checkDispatchedNotices();
  }, [user?.id, activeHospital?.id, activeHospital?.verification_notes]);

  // 2. Real-time subscription to notifications table
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `hospital-dispatch-realtime-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && payload.new.type === 'admin_dispatch') {
            setActiveNotice(payload.new);
            setIsOpen(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleAcknowledge = async () => {
    if (!activeNotice) return;
    try {
      setAcknowledging(true);
      if (!activeNotice.isFallback) {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', activeNotice.id);
        sessionStorage.setItem(`openhealth_dismissed_dispatch_${activeNotice.id}`, '1');
      } else if (activeHospital?.id) {
        sessionStorage.setItem(`openhealth_dismissed_note_${activeHospital.id}_${activeHospital.verification_notes.slice(0, 15)}`, '1');
      }
      setIsOpen(false);
      setActiveNotice(null);
      if (refreshHospital) refreshHospital();
    } catch (e) {
      console.error('Failed to acknowledge dispatch:', e);
      setIsOpen(false);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleNavigateToKyc = async () => {
    await handleAcknowledge();
    navigate('/hospital/profile');
  };

  if (!isOpen || !activeNotice) return null;

  const formattedDate = activeNotice.created_at
    ? new Date(activeNotice.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just now';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-amber-300 shadow-2xl shadow-amber-900/20 overflow-hidden text-slate-900"
      >
        {/* Top Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <BellRing className="w-4.5 h-4.5 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-100 block">
                Official Platform Notice
              </span>
              <h2 className="text-sm font-black tracking-tight text-white leading-tight">
                Urgent Administrator Dispatch
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAcknowledge}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Facility Identifier Bar */}
          <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[240px]">{activeHospital?.name || 'Your Facility'}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Dispatched Message Callout */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{activeNotice.title || 'Action Required by Platform Admin'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium pl-6">
              "{activeNotice.message}"
            </p>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Please review the requested documents or facility parameters to ensure full compliance with the OpenHealth Healthcare Standards Board.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleNavigateToKyc}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Update KYC / Profile Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              {acknowledging ? 'Acknowledging...' : 'Acknowledge Notice'}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
