import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  CameraOff,
  VideoOff,
  Upload, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  HeartPulse, 
  Phone, 
  Stethoscope, 
  CalendarClock, 
  Activity, 
  FileText, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  SwitchCamera,
  Check,
  CreditCard
} from 'lucide-react';
import useQrScanner, { extractPatientIdentifier, playScanBeep } from '../../hooks/useQrScanner';
import hospitalPortalService from '../../services/hospitalPortalService';

export default function DoctorAppointmentQrModal({
  isOpen,
  onClose,
  appointment = null,
  hospitalId,
  mode = 'confirm', // 'confirm' | 'complete'
  onSuccess
}) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'manual' | 'upload'
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [receptionNotes, setReceptionNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifiedPatient, setVerifiedPatient] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for callbacks & changing values
  const modeRef = useRef(mode);
  const hospitalIdRef = useRef(hospitalId);
  const appointmentRef = useRef(appointment);
  const receptionNotesRef = useRef(receptionNotes);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  const qrScannerRef = useRef(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { hospitalIdRef.current = hospitalId; }, [hospitalId]);
  useEffect(() => { appointmentRef.current = appointment; }, [appointment]);
  useEffect(() => { receptionNotesRef.current = receptionNotes; }, [receptionNotes]);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const scannerContainerId = 'doctor-appt-qr-scanner-box';

  // Handle scanned QR result — note: useQrScanner shuts off camera automatically on detection
  const handleQrDetected = useCallback(async (rawText) => {
    const cleanId = extractPatientIdentifier(rawText);
    if (!cleanId) {
      setVerifyError('Could not extract a valid Patient UID or ABHA Number from QR code.');
      qrScannerRef.current?.resetLock();
      return;
    }

    try {
      setVerifying(true);
      setVerifyError(null);

      const patientData = await hospitalPortalService.scanPatient(cleanId);
      if (!patientData) {
        throw new Error(`No verified clinical record found for "${cleanId}".`);
      }

      setVerifiedPatient(patientData);
      setSubmitting(true);

      const patientUid = patientData.patientUid || patientData.userId || patientData.abhaId || cleanId;
      const appt = appointmentRef.current;
      const hId = hospitalIdRef.current;

      if (modeRef.current === 'complete') {
        const payload = {
          hospital_id: hId,
          appointment_id: appt?.id || null,
          patient_uid: patientUid,
          notes: receptionNotesRef.current || 'Clinical encounter verified & completed automatically via QR Scan'
        };
        const result = await hospitalPortalService.completeAppointmentQr(payload);
        setSuccessMessage(result.message || 'Clinical encounter completed successfully via QR scan!');
        setCompletedSuccess(true);

        setTimeout(() => {
          if (onSuccessRef.current) onSuccessRef.current(result);
          if (onCloseRef.current) onCloseRef.current();
        }, 1300);
      } else {
        const payload = {
          hospital_id: hId,
          appointment_id: appt?.id || null,
          patient_uid: patientUid,
          notes: receptionNotesRef.current || 'Patient verified and checked in via QR scan at reception'
        };
        const result = await hospitalPortalService.confirmAppointmentQr(payload);
        setSuccessMessage(result.message || 'Patient check-in confirmed via QR scan!');
        setCompletedSuccess(true);

        setTimeout(() => {
          if (onSuccessRef.current) onSuccessRef.current(result);
          if (onCloseRef.current) onCloseRef.current();
        }, 1300);
      }
    } catch (err) {
      console.warn('QR encounter execution error:', err);
      setVerifyError(err.message || 'Failed to process appointment via QR scan.');
      qrScannerRef.current?.resetLock();
    } finally {
      setVerifying(false);
      setSubmitting(false);
    }
  }, []);

  // Initialize QR Scanner hook — active strictly when in camera mode and cameraEnabled
  const isScannerActive = isOpen && scanMode === 'camera' && cameraEnabled && !completedSuccess && !verifiedPatient && !verifying;
  const qrScanner = useQrScanner({
    videoContainerId: scannerContainerId,
    onScan: handleQrDetected,
    active: isScannerActive
  });
  qrScannerRef.current = qrScanner;

  // Handle uploaded QR image file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVerifying(true);
      setVerifyError(null);
      const decoded = await qrScanner.scanFile(file);
      if (decoded) {
        handleQrDetected(decoded);
      } else {
        setVerifyError('No QR code detected in the selected image. Please try a clearer image.');
        setVerifying(false);
      }
    } catch (err) {
      setVerifyError('Failed to decode QR from image: ' + (err.message || 'Unknown error'));
      setVerifying(false);
    }
  };

  // Handle manual ABHA/UID submission
  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    qrScanner.resetLock();
    handleQrDetected(manualInput);
  };

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setVerifiedPatient(null);
      setVerifyError(null);
      setCompletedSuccess(false);
      setSuccessMessage('');
      setScanMode('camera');
      setCameraEnabled(true);
      setManualInput('');
      setReceptionNotes(
        mode === 'complete'
          ? 'Clinical encounter verified & completed automatically via QR scan.'
          : `Patient verified via QR scan for ${appointment?.doctorName || 'Doctor'} OPD.`
      );
    }
  }, [isOpen, appointment?.id, mode]);

  const handleCloseModal = () => {
    qrScanner.stopScanner();
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const isCompleteMode = mode === 'complete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 text-white ${
          isCompleteMode 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {isCompleteMode ? 'Complete Encounter via QR Scan' : 'Doctor OPD Check-In'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {isCompleteMode 
                  ? 'Scan Patient QR Code to Automatically Complete Clinical Encounter' 
                  : 'Scan Patient QR Code to Confirm OPD Check-In'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Appointment Details */}
          {appointment ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-200">
                  {appointment.doctorImage ? (
                    <img 
                      src={appointment.doctorImage} 
                      alt={appointment.doctorName} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{appointment.doctorName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {appointment.departmentName || 'OPD Speciality'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{appointment.doctorSpecialization}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                      {appointment.appointmentDate} • {appointment.appointmentTime}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      ₹{appointment.consultationFee}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Patient Scheduled</span>
                <span className="text-sm font-bold text-slate-800">{appointment.patientName}</span>
                <span className="text-[11px] text-blue-600 font-bold flex items-center justify-end gap-1 mt-0.5">
                  <QrCode className="w-3 h-3" />
                  <span>ABHA Protected</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Smart Encounter Scanner:</strong> Scan any patient QR code to automatically locate and complete today's consultation encounter.
              </span>
            </div>
          )}

          {/* Success Notification Banner */}
          {completedSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-10 text-center space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                {isCompleteMode ? 'Encounter Completed!' : 'Check-In Confirmed!'}
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {successMessage || (isCompleteMode
                  ? 'Clinical encounter verified & closed automatically in hospital database.'
                  : 'Patient identity verified against appointment schedule.')}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Mode Selection Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyError(null);
                    setScanMode('camera');
                    setCameraEnabled(true);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                    scanMode === 'camera'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Live Camera Scanner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode('manual');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                    scanMode === 'manual'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Manual ABHA / UID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode('upload');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                    scanMode === 'upload'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload QR Image
                </button>
              </div>

              {/* Mode 1: Live Camera Scanner */}
              {scanMode === 'camera' && (
                <div className="space-y-3">
                  {/* Camera Status & Manual Controls */}
                  <div className="flex items-center justify-between px-1 text-xs">
                    <div className="flex items-center gap-2">
                      {qrScanner.scanning ? (
                        <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          Camera Active (Scanning)
                        </span>
                      ) : qrScanner.isStarting ? (
                        <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Requesting camera permissions...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <VideoOff className="w-3.5 h-3.5 text-slate-400" />
                          Camera Off (Click to Start)
                        </span>
                      )}
                    </div>

                    {qrScanner.scanning ? (
                      <button
                        type="button"
                        onClick={() => setCameraEnabled(false)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold flex items-center gap-1 border border-rose-200 transition-colors"
                      >
                        <CameraOff className="w-3 h-3" />
                        Turn Off Camera
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyError(null);
                          qrScanner.resetLock();
                          setCameraEnabled(true);
                          qrScanner.startScanner();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200 transition-colors"
                      >
                        <Camera className="w-3 h-3" />
                        Turn On Camera
                      </button>
                    )}
                  </div>

                  {/* Viewport Box */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-w-sm mx-auto shadow-inner" style={{ minHeight: '300px' }}>
                    <div id={scannerContainerId} style={{ width: '100%', height: '300px' }} />
                    
                    {/* Scanner Target Overlay */}
                    {qrScanner.scanning && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-xl relative">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1" />
                          <motion.div
                            animate={{ y: [0, 180, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                            className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-full opacity-80"
                          />
                        </div>
                      </div>
                    )}

                    {/* Connecting state */}
                    {qrScanner.isStarting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                        <div className="text-center text-teal-400 text-xs space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400" />
                          <span>Connecting to camera hardware...</span>
                        </div>
                      </div>
                    )}

                    {/* Stopped / Off State */}
                    {(!cameraEnabled || (qrScanner.isStopped && !qrScanner.error)) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
                          <Camera className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Camera Scanner Ready</p>
                        <p className="text-xs text-slate-400 mb-3 max-w-[220px]">
                          Click below to start your webcam and scan the patient's QR code.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyError(null);
                            qrScanner.resetLock();
                            setCameraEnabled(true);
                            qrScanner.startScanner();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Start Camera Scanner
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera selector & helpers */}
                  <div className="flex justify-center gap-2 flex-wrap">
                    {qrScanner.cameras.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const cams = qrScanner.cameras;
                          const curIdx = cams.findIndex(c => c.deviceId === qrScanner.activeCameraId);
                          const nextIdx = (curIdx + 1) % cams.length;
                          qrScanner.switchCamera(cams[nextIdx].deviceId);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        Switch Camera
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyError(null);
                        qrScanner.resetLock();
                        setCameraEnabled(true);
                        qrScanner.startScanner(qrScanner.activeCameraId || null);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restart Scanner
                    </button>
                  </div>

                  <p className="text-center text-xs text-slate-500">
                    Hold the patient's QR code steadily in front of the lens. The camera will shut off automatically upon successful scan.
                  </p>
                </div>
              )}

              {/* Mode 2: Manual Search */}
              {scanMode === 'manual' && (
                <div className="space-y-4 max-w-md mx-auto py-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Patient ABHA Number / System UID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 91-7705-2080-4113 or UUID"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      />
                      <button
                        type="button"
                        onClick={handleManualSubmit}
                        disabled={verifying || submitting || !manualInput.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        {verifying || submitting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {isCompleteMode ? 'Complete' : 'Verify'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Input the patient's 14-digit ABHA number or system UID to process the encounter.
                  </p>
                </div>
              )}

              {/* Mode 3: File Upload */}
              {scanMode === 'upload' && (
                <div className="max-w-md mx-auto py-4">
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all text-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-700">Click to upload QR Image</span>
                    <span className="text-[11px] text-slate-400 mt-1">PNG, JPG or Screenshot of Patient QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Error Message with Retry */}
              {(qrScanner.error || verifyError) && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{qrScanner.error || verifyError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyError(null);
                      qrScanner.resetLock();
                      setScanMode('camera');
                      setCameraEnabled(true);
                      qrScanner.startScanner();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold shrink-0 text-[11px] transition-colors"
                  >
                    Retry Scan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Close
          </button>

          {(verifying || submitting) && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Processing QR Encounter...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
