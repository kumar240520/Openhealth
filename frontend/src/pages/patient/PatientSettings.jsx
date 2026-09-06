import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Shield, 
  Lock, 
  Download, 
  Globe, 
  Check, 
  AlertCircle, 
  Save, 
  Loader2, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  AlertTriangle,
  FileText,
  KeyRound,
  Trash2
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';

export default function PatientSettings() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    sms_alerts: true,
    whatsapp_updates: true,
    email_reports: true,
    emergency_broadcast_alerts: true,
    abha_data_sharing: true,
    anonymous_analytics: false,
    preferred_language: 'en'
  });

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch settings from backend
  const fetchSettings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await patientService.getSettings();
      if (data) {
        setSettings({
          sms_alerts: Boolean(data.sms_alerts),
          whatsapp_updates: Boolean(data.whatsapp_updates),
          email_reports: Boolean(data.email_reports),
          emergency_broadcast_alerts: Boolean(data.emergency_broadcast_alerts),
          abha_data_sharing: Boolean(data.abha_data_sharing),
          anonymous_analytics: Boolean(data.anonymous_analytics),
          preferred_language: data.preferred_language || 'en'
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      showToast(err.message || 'Failed to load settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await patientService.updateSettings(settings);
      showToast('Settings saved successfully!');
    } catch (err) {
      console.error('Save settings error:', err);
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Download Medical Data Export
  const handleExportData = async () => {
    try {
      showToast('Preparing your health records summary...');
      const profileData = await patientService.getProfile();
      const exportJson = {
        exported_at: new Date().toISOString(),
        platform: 'OpenHealth India',
        user_identity: {
          name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          abha_id: profileData.patient_details?.abha_id
        },
        clinical_profile: profileData.patient_details
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportJson, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `openhealth_medical_pass_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Health data export downloaded successfully!');
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    }
  };

  return (
    <AppLayout>
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-6 select-none min-w-0">

        {/* Toast Notification */}
        {toastMsg && (
          <div className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-fade-in ${
            toastMsg.type === 'error' ? 'bg-rose-900 text-white' : 'bg-slate-900 text-white'
          }`}>
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* 1. HEADER                                                           */}
        {/* =================================================================== */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-slate-700 font-extrabold">Settings</span>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
            Account & Privacy Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
            Manage your alerts, ABHA consent, security credentials, and preferences
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-bold">Loading your preferences...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">

            {/* =============================================================== */}
            {/* 2. HEALTHCARE NOTIFICATIONS                                     */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Bell className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Healthcare Alerts & Notifications
                </h3>
              </div>

              <div className="flex flex-col divide-y divide-slate-100 text-xs">
                
                {/* SMS Alerts */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">SMS Alerts for Bed Holds & Admissions</h4>
                      <p className="text-slate-400 font-medium mt-0.5">
                        Receive instant SMS confirmations for emergency bed reservations and doctor appointments.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sms_alerts}
                    onChange={(e) => setSettings({ ...settings, sms_alerts: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* WhatsApp Updates */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">WhatsApp Prescription & Status Updates</h4>
                      <p className="text-slate-400 font-medium mt-0.5">
                        Get your digital prescriptions and queue status directly on your registered WhatsApp.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsapp_updates}
                    onChange={(e) => setSettings({ ...settings, whatsapp_updates: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Email Reports */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">Email Lab Reports & Bill Audits</h4>
                      <p className="text-slate-400 font-medium mt-0.5">
                        Receive detailed PDF summaries whenever a hospital bill or lab report is analyzed.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.email_reports}
                    onChange={(e) => setSettings({ ...settings, email_reports: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Emergency Alerts */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">Critical Emergency Broadcasts (Always Active)</h4>
                      <p className="text-slate-400 font-medium mt-0.5">
                        Mandatory high-priority alerts for ambulance dispatch and life-support bed availability.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>

              </div>
            </div>

            {/* =============================================================== */}
            {/* 3. ABHA & DATA PRIVACY                                          */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  ABHA & Health Data Privacy
                </h3>
              </div>

              <div className="flex flex-col divide-y divide-slate-100 text-xs">
                
                {/* ABHA Sharing */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900">Ayushman Bharat (ABHA) Health Records Consent</h4>
                    <p className="text-slate-400 font-medium mt-0.5 max-w-xl">
                      Authorize empanelled hospitals and certified diagnostic labs in Indore to view your shared health records during active admissions.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.abha_data_sharing}
                    onChange={(e) => setSettings({ ...settings, abha_data_sharing: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Anonymous Analytics */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900">Anonymized Regional Healthcare Research</h4>
                    <p className="text-slate-400 font-medium mt-0.5 max-w-xl">
                      Allow completely de-identified, non-personal epidemiological benchmarking to improve healthcare transparency in Madhya Pradesh.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.anonymous_analytics}
                    onChange={(e) => setSettings({ ...settings, anonymous_analytics: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Download Health Records */}
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900">Export Your Health Locker</h4>
                    <p className="text-slate-400 font-medium mt-0.5">
                      Download an official JSON archive containing your clinical profile, vitals, and emergency contacts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download Archive</span>
                  </button>
                </div>

              </div>
            </div>

            {/* =============================================================== */}
            {/* 4. LANGUAGE & SECURITY                                          */}
            {/* =============================================================== */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Localization & Account Security
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                
                {/* Language selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">App Interface Language</label>
                  <select
                    value={settings.preferred_language}
                    onChange={(e) => setSettings({ ...settings, preferred_language: e.target.value })}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English (India)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                  </select>
                </div>

                {/* Authentication method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">Primary Authentication Mode</label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Numeric OTP Verification (Google SMTP)</span>
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

              </div>
            </div>

            {/* Save Settings Action Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Settings Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>
    </AppLayout>
  );
}
