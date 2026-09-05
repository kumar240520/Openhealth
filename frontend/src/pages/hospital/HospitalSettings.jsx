import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Bell, 
  Shield, 
  Clock, 
  Sliders, 
  Save, 
  Check, 
  Key, 
  Copy, 
  RefreshCw, 
  Smartphone, 
  Mail, 
  AlertTriangle, 
  Building2,
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import HospitalLayout from '../../components/hospital/layout/HospitalLayout';
import { useHospital } from '../../context/HospitalContext';
import { supabase } from '../../lib/supabaseClient';

export default function HospitalSettings() {
  const { activeHospital, activeHospitalId, refreshHospital } = useHospital();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'notifications' | 'security' | 'api'
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    autoAcceptEmergency: true,
    slotDurationMinutes: 20,
    dailyConsultationLimit: 30,
    currency: 'INR',
    smsAlerts: true,
    emailAlerts: true,
    triageChime: true,
    dailyDigest: true,
    sessionTimeoutHours: 8,
    requireTwoFactor: false,
    apiKey: 'hosp_live_sec_994821a8f9037c89b02e'
  });

  useEffect(() => {
    if (!activeHospitalId) return;
    const stored = localStorage.getItem(`openhealth_hospital_settings_${activeHospitalId}`);
    if (stored) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch (e) { /* ignore */ }
    } else if (activeHospital) {
      setSettings(prev => ({
        ...prev,
        autoAcceptEmergency: activeHospital.emergency_available !== false
      }));
    }
  }, [activeHospitalId, activeHospital]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      localStorage.setItem(
        `openhealth_hospital_settings_${activeHospitalId}`,
        JSON.stringify(settings)
      );

      // Sync emergency availability to hospitals table if changed
      if (activeHospitalId && settings.autoAcceptEmergency !== undefined) {
        await supabase
          .from('hospitals')
          .update({
            emergency_available: settings.autoAcceptEmergency,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeHospitalId);
        refreshHospital();
      }

      showToast('Hospital configuration successfully saved and persisted.');
    } catch (err) {
      console.warn('Error saving settings:', err);
      showToast('Settings saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(settings.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast('API Key copied to clipboard.');
  };

  const handleRegenerateKey = () => {
    const newKey = `hosp_live_sec_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 10)}`;
    setSettings(prev => ({ ...prev, apiKey: newKey }));
    showToast('New secret API key generated. Make sure to save changes.');
  };

  return (
    <HospitalLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-16 text-slate-800">
        
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Hospital Settings & Preferences
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Operations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Manage clinical operations, notification triggers, and security controls for {activeHospital?.name || 'Hospital'}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs border">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Clinical Operations</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'api'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API & Integrations</span>
          </button>
        </div>

        {/* Tab 1: Clinical Operations */}
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">OPD & Consultation Rules</h3>
                <p className="text-xs text-slate-500 mt-0.5">Control physician consultation appointment slots and intake quotas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Default Consultation Slot Duration
                  </label>
                  <select
                    value={settings.slotDurationMinutes}
                    onChange={(e) => handleChange('slotDurationMinutes', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={15}>15 Minutes (Rapid OPD)</option>
                    <option value={20}>20 Minutes (Standard)</option>
                    <option value={30}>30 Minutes (Comprehensive)</option>
                    <option value={45}>45 Minutes (Specialist / Surgical Evaluation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Max Daily Patient Limit Per Doctor
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.dailyConsultationLimit}
                    onChange={(e) => handleChange('dailyConsultationLimit', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Auto-Accept Emergency 15-Minute Bed Holds
                    </span>
                    <span className="text-[11px] text-slate-500 block max-w-xl">
                      When enabled, inbound ambulance and emergency patients can lock critical ICU/HDU beds immediately without prior receptionist confirmation.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.autoAcceptEmergency}
                      onChange={() => handleToggle('autoAcceptEmergency')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Platform Billing Currency
                </label>
                <div className="flex gap-3">
                  {['INR', 'USD', 'EUR'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => handleChange('currency', curr)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        settings.currency === curr
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {curr === 'INR' ? '₹ INR (Indian Rupee)' : curr === 'USD' ? '$ USD' : '€ EUR'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Communication & Alert Dispatch</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure automated communication channels for hospital staff and ward stations.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'smsAlerts', title: 'SMS Triage Alerts', desc: 'Send emergency SMS to on-call supervisor when casualty bed locks occur.', icon: Smartphone },
                  { id: 'emailAlerts', title: 'Email Dispatch Records', desc: 'Email daily consultation schedules to assigned physicians each morning.', icon: Mail },
                  { id: 'triageChime', title: 'Audible Reception Chime', desc: 'Play audible tone on reception desk when patient scans QR code.', icon: Bell },
                  { id: 'dailyDigest', title: 'Daily Operational Digest', desc: 'Receive high-level operational occupancy and revenue digest at midnight.', icon: Clock }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{item.title}</span>
                          <span className="text-[11px] text-slate-500 block">{item.desc}</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings[item.id]}
                          onChange={() => handleToggle(item.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Security & Access */}
        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">Security & Authentication Policies</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage session durations and access security for hospital staff accounts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Staff Portal Idle Session Timeout
                  </label>
                  <select
                    value={settings.sessionTimeoutHours}
                    onChange={(e) => handleChange('sessionTimeoutHours', Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={1}>1 Hour (High Security)</option>
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours (Standard Shift)</option>
                    <option value={24}>24 Hours (Emergency Triage Console)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Require Two-Factor (2FA)</span>
                    <span className="text-[11px] text-slate-500 block">For receptionist and admission desk staff</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.requireTwoFactor}
                      onChange={() => handleToggle('requireTwoFactor')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: API & Integrations */}
        {activeTab === 'api' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-900">Hospital Telemetry API Key</h3>
                <p className="text-xs text-slate-500 mt-0.5">Use this secret key to integrate hospital HIS / EHR bed management systems directly with OpenHealth.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Production Secret Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    readOnly
                    value={settings.apiKey}
                    className="flex-1 px-3.5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Roll Key</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </HospitalLayout>
  );
}
