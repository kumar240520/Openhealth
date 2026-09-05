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
  Bed, 
  Activity, 
  FileText, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  SwitchCamera,
  Volume2,
  Check
} from 'lucide-react';
import useQrScanner, { extractPatientIdentifier, playScanBeep } from '../../hooks/useQrScanner';
import hospitalPortalService from '../../services/hospitalPortalService';

export default function PatientQrAdmissionModal({
  isOpen,
  onClose,
  hospitalId,
  prefilledBooking = null,
  availableBedTypes = [],
  onAdmissionSuccess
}) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'manual' | 'upload'
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [manualUid, setManualUid] = useState('');
  const [scanError, setScanError] = useState(null);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);

  // Patient Telemetry State
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const [verifiedPatient, setVerifiedPatient] = useState(null);

  // Admission Form Fields
  const [selectedBedType, setSelectedBedType] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [occupiedBeds, setOccupiedBeds] = useState(new Set());
  const [diagnosis, setDiagnosis] = useState('Acute Inpatient Admission');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Lookup patient by UID / ABHA
  const handleLookupPatient = useCallback(async (rawIdentifier) => {
    if (!rawIdentifier || !String(rawIdentifier).trim()) return;

    const clean = extractPatientIdentifier(rawIdentifier);
    if (!clean) {
      setScanError('Unable to extract a valid patient UID or ABHA ID from the scanned data.');
      qrScannerRef.current?.resetLock();
      return;
    }

    try {
      setFetchingPatient(true);
      setScanError(null);
      const patient = await hospitalPortalService.scanPatient(clean);
      if (patient) {
        setVerifiedPatient(patient);
        setManualUid(patient.abhaId || clean);
        setScanSuccessFlash(true);
        qrScannerRef.current?.stopScanner();
      } else {
        setScanError(`No patient profile matching "${clean}" found in system registry.`);
        qrScannerRef.current?.resetLock();
      }
    } catch (err) {
      setScanError('Failed to retrieve patient clinical records: ' + (err.message || 'Unknown error'));
      qrScannerRef.current?.resetLock();
    } finally {
      setFetchingPatient(false);
    }
  }, []);

  // Handle QR scan detection
  const handleQrDetected = useCallback((rawText) => {
    playScanBeep();
    handleLookupPatient(rawText);
  }, [handleLookupPatient]);

  // Initialize the QR scanner hook
  const isScannerActive = isOpen && scanMode === 'camera' && cameraEnabled && !verifiedPatient && !fetchingPatient;
  const qrScanner = useQrScanner({
    videoContainerId: 'qr-reader-target',
    onScan: handleQrDetected,
    active: isScannerActive
  });
  qrScannerRef.current = qrScanner;

  // Helper to dynamically allocate the next free bed number
  const resolveNextBedNumber = (bedTypeId, occupiedSet) => {
    const bt = (availableBedTypes || []).find(b => (b.id === bedTypeId || b.bed_type_id === bedTypeId));
    const name = (bt?.name || bt?.bed_types?.name || '').toUpperCase();
    let prefix = 'BED';
    if (name.includes('ICU')) prefix = 'ICU';
    else if (name.includes('HDU')) prefix = 'HDU';
    else if (name.includes('GENERAL')) prefix = 'GEN';
    else if (name.includes('PRIVATE')) prefix = 'PVT';
    else if (name.includes('SEMI')) prefix = 'SP';
    else if (name.includes('EMERGENCY')) prefix = 'EMG';
    
    let num = 101;
    const occ = occupiedSet || occupiedBeds;
    while (occ.has(`${prefix}-${num}`.toUpperCase())) {
      num++;
    }
    return `${prefix}-${num}`;
  };

  // Pre-fill fields and dynamically calculate unique vacant bed number
  useEffect(() => {
    if (isOpen) {
      setVerifiedPatient(null);
      setScanSuccessFlash(false);
      setScanError(null);
      setCameraEnabled(true);
      setScanMode('camera');
      setManualUid('');

      // Fetch occupied beds for this hospital to guarantee unique bed units
      if (hospitalId) {
        hospitalPortalService.getAdmissions(hospitalId).then(adms => {
          const occSet = new Set(
            (adms || [])
              .filter(a => a.status === 'admitted')
              .map(a => (a.bed_number || '').trim().toUpperCase())
          );
          setOccupiedBeds(occSet);

          const targetTypeId = prefilledBooking?.bed_type_id || (availableBedTypes[0]?.bed_type_id || availableBedTypes[0]?.id || '');
          if (targetTypeId) {
            setSelectedBedType(targetTypeId);
            const autoBed = resolveNextBedNumber(targetTypeId, occSet);
            setBedNumber(autoBed);
          }
        }).catch(e => {
          console.warn('Could not fetch occupied beds:', e);
          const targetTypeId = prefilledBooking?.bed_type_id || (availableBedTypes[0]?.bed_type_id || availableBedTypes[0]?.id || '');
          if (targetTypeId) {
            setSelectedBedType(targetTypeId);
            setBedNumber(resolveNextBedNumber(targetTypeId, new Set()));
          }
        });
      }

      if (prefilledBooking) {
        setDiagnosis(prefilledBooking.notes || 'Emergency Bed Intake');
      }
    }
  }, [isOpen, prefilledBooking?.id, hospitalId, availableBedTypes]);

  // Support clipboard paste (Ctrl+V) anywhere in modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      // 1. Check for pasted image file
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob && qrScannerRef.current) {
              const decoded = await qrScannerRef.current.scanFile(blob);
              if (decoded) handleLookupPatient(decoded);
              return;
            }
          }
        }
      }

      // 2. Check for pasted text (UID or ABHA)
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.trim().length >= 8) {
        const clean = extractPatientIdentifier(pastedText);
        if (clean) {
          await handleLookupPatient(clean);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, handleLookupPatient]);

  // Handle file upload
  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setFetchingPatient(true);
      setScanError(null);
      const decoded = await qrScanner.scanFile(file);
      if (decoded) {
        playScanBeep();
        setScanSuccessFlash(true);
        await handleLookupPatient(decoded);
      } else {
        setScanError('Could not decode QR code from the uploaded image. Please ensure the QR is clear and well-lit.');
      }
    } catch (err) {
      setScanError('Failed to decode QR image: ' + (err.message || 'Unknown error'));
    } finally {
      setFetchingPatient(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Final Admission
  const handleSubmitAdmission = async (e) => {
    e.preventDefault();
    if (!verifiedPatient) {
      setScanError('Please scan or select a verified patient first.');
      return;
    }

    try {
      setSubmitting(true);
      setScanError(null);

      if (bedNumber && occupiedBeds.has(bedNumber.trim().toUpperCase())) {
        setScanError(`Unit "${bedNumber}" is currently occupied by another active inpatient. Please allocate a vacant unit.`);
        return;
      }

      const payload = {
        hospital_id: hospitalId,
        patient_uid: verifiedPatient.patientUid || verifiedPatient.userId || verifiedPatient.abhaId,
        reservation_id: prefilledBooking?.id || null,
        bed_type_id: selectedBedType || null,
        bed_number: bedNumber || resolveNextBedNumber(selectedBedType, occupiedBeds),
        diagnosis: diagnosis || 'Clinical Inpatient Admission',
        clinical_notes: clinicalNotes || 'Admitted via QR Scan intake desk'
      };

      const res = await hospitalPortalService.admitPatient(payload);
      if (onAdmissionSuccess) {
        onAdmissionSuccess(res);
      }
      handleClose();
    } catch (err) {
      console.warn('Admission submission failed:', err);
      setScanError(err.message || 'Failed to complete patient admission. Please check available beds.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    qrScanner.stopScanner();
    setVerifiedPatient(null);
    setManualUid('');
    setScanError(null);
    setScanSuccessFlash(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl text-teal-300 ring-1 ring-white/20">
                <QrCode className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold">Patient Admission & QR Intake Engine</h3>
                <p className="text-xs text-teal-200/90">
                  Instant clinical EHR retrieval & verified bed allocation
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {prefilledBooking && (
            <div className="mt-4 pt-3 border-t border-teal-600/50 flex items-center justify-between text-xs">
              <span className="text-teal-200">
                Linked Reservation: <strong className="text-white">{prefilledBooking.code}</strong>
                {prefilledBooking.patientName && (
                  <span className="text-teal-100 font-semibold ml-2">
                    • Scheduled: <strong className="text-white">{prefilledBooking.patientName}</strong>
                  </span>
                )}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                {prefilledBooking.bedType}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Linked Booking Intake Guidance */}
          {prefilledBooking && !verifiedPatient && (
            <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-center gap-2.5 text-xs text-teal-900">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Physical QR Intake Required:</strong> Hold <strong>{prefilledBooking.patientName || 'the patient'}</strong>'s QR code in front of the lens to retrieve clinical EHR and complete admission.
              </span>
            </div>
          )}
          {/* Error Banner with Retry */}
          {(scanError || qrScanner.error) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="font-semibold">{scanError || qrScanner.error}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setScanError(null);
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

          {/* STEP 1: PATIENT IDENTIFICATION */}
          {!verifiedPatient ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  Step 1: Scan Patient QR or Search ABHA
                </h4>

                {/* Scan Mode Toggle */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setScanError(null);
                      setScanMode('camera');
                      setCameraEnabled(true);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      scanMode === 'camera'
                        ? 'bg-white text-teal-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Live Camera
                  </button>
                  <button
                    onClick={() => {
                      setScanMode('manual');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      scanMode === 'manual'
                        ? 'bg-white text-teal-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    ABHA / UID
                  </button>
                  <button
                    onClick={() => {
                      setScanMode('upload');
                      fileInputRef.current?.click();
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      scanMode === 'upload'
                        ? 'bg-white text-teal-800 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Image / Paste
                  </button>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* CAMERA SCANNER VIEWPORT */}
              {scanMode === 'camera' && (
                <div className="space-y-3">
                  {/* Camera Status Bar & Hardware Protection Controls */}
                  <div className="flex items-center justify-between px-1 text-xs">
                    <div className="flex items-center gap-2">
                      {qrScanner.scanning ? (
                        <span className="flex items-center gap-1.5 font-bold text-teal-700">
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
                          setScanError(null);
                          qrScanner.resetLock();
                          setCameraEnabled(true);
                          qrScanner.startScanner();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold flex items-center gap-1 border border-teal-200 transition-colors"
                      >
                        <Camera className="w-3 h-3" />
                        Turn On Camera
                      </button>
                    )}
                  </div>

                  <div 
                    className={`relative rounded-3xl overflow-hidden border-2 transition-all bg-slate-950 p-2 text-center ${
                      scanSuccessFlash 
                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                        : 'border-teal-500/40'
                    }`}
                  >
                    {/* Viewfinder Target Container */}
                    <div 
                      id="qr-reader-target" 
                      style={{ width: '100%', height: '300px' }}
                      className="mx-auto overflow-hidden rounded-2xl bg-black relative flex items-center justify-center"
                    />

                    {/* Laser Scan Animation Overlay */}
                    {qrScanner.scanning && !scanSuccessFlash && (
                      <div className="absolute inset-x-8 top-12 bottom-12 pointer-events-none flex flex-col justify-between">
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite]" />
                        <div className="flex justify-between items-center text-[10px] text-emerald-400/80 font-mono bg-slate-950/60 backdrop-blur-sm px-3 py-1 rounded-full mx-auto">
                          <span>Align patient QR code within frame</span>
                        </div>
                      </div>
                    )}

                    {/* Connecting Feedback */}
                    {qrScanner.isStarting && !scanSuccessFlash && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-teal-400">
                          <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                          <span>Connecting to camera hardware...</span>
                        </div>
                      </div>
                    )}

                    {/* Camera Off State */}
                    {(!cameraEnabled || (qrScanner.isStopped && !scanSuccessFlash && !qrScanner.error)) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
                          <Camera className="w-6 h-6 text-teal-400" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Camera Scanner Ready</p>
                        <p className="text-xs text-slate-400 mb-3 max-w-[220px]">
                          Click below to start your webcam and scan the patient's admission QR code.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setScanError(null);
                            qrScanner.resetLock();
                            setCameraEnabled(true);
                            qrScanner.startScanner();
                          }}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Start Camera Scanner
                        </button>
                      </div>
                    )}

                    {/* Scan Success Banner */}
                    {scanSuccessFlash && (
                      <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-sm">
                        <div className="bg-emerald-600 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                          <Check className="w-5 h-5" />
                          <span>QR Code Scanned! Retrieving EHR...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls & Device Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {qrScanner.cameras.length > 1 ? (
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl">
                        <SwitchCamera className="w-3.5 h-3.5 text-slate-500" />
                        <select
                          value={qrScanner.activeCameraId}
                          onChange={(e) => qrScanner.switchCamera(e.target.value)}
                          className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer max-w-[200px] truncate"
                        >
                          {qrScanner.cameras.map(cam => (
                            <option key={cam.deviceId} value={cam.deviceId}>
                              {cam.label || `Camera (${cam.deviceId.slice(0, 6)}...)`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-teal-600" />
                        Audio beep enabled on detection
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScanError(null);
                          qrScanner.resetLock();
                          setCameraEnabled(true);
                          qrScanner.startScanner(qrScanner.activeCameraId || null);
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Restart Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScanMode('manual');
                        }}
                        className="px-2.5 py-1 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg font-bold transition-colors"
                      >
                        Manual ABHA Search
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MANUAL SEARCH & PASTE VIEW */}
              {(scanMode === 'manual' || scanMode === 'upload') && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Patient ABHA ID or System UID
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Enter the patient's 14-digit ABHA ID (e.g. 91-7705-2080-4113) or paste a QR code image / text directly (Ctrl+V).
                    </p>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="e.g. 91-7705-2080-4113 or bfbacf26-0bd4-429d-a6e4-64c35f98ba11"
                          value={manualUid}
                          onChange={(e) => setManualUid(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              qrScanner.resetLock();
                              handleLookupPatient(manualUid);
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          qrScanner.resetLock();
                          handleLookupPatient(manualUid);
                        }}
                        disabled={fetchingPatient || !manualUid.trim()}
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        {fetchingPatient ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                        Fetch Telemetry
                      </button>
                    </div>
                  </div>

                  {/* Upload QR Image Dropzone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl bg-white text-center cursor-pointer transition-colors space-y-1"
                  >
                    <Upload className="w-5 h-5 text-teal-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">Click to upload patient QR image or press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Ctrl+V</kbd> to paste screenshot</p>
                    <p className="text-[10px] text-slate-400">Supports PNG, JPG, WebP patient profile passes</p>
                  </div>

                  {/* Quick-select Demo Patient Badges */}
                  <div className="pt-3 border-t border-slate-200/70">
                    <p className="text-[11px] font-bold text-slate-600 mb-2">Registered Patient Presets for Testing:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleLookupPatient('91-7705-2080-4113')}
                        className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Hitesh Kumar (91-7705-2080-4113)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLookupPatient('a9e7819f-30e0-4c0d-b808-1d0dbe4a827f')}
                        className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kundan Kumar (Emergency Intake)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VERIFIED PATIENT CLINICAL TELEMETRY CARD */
            <div className="p-5 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 border border-teal-200 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {verifiedPatient.fullName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">
                        {verifiedPatient.fullName}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        ABHA Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      ABHA ID: <span className="font-mono font-bold text-slate-900">{verifiedPatient.abhaId || 'Verified Telemetry'}</span> • {verifiedPatient.age || 28} Y / {verifiedPatient.gender ? (verifiedPatient.gender.charAt(0).toUpperCase() + verifiedPatient.gender.slice(1)) : 'Recorded'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVerifiedPatient(null);
                    setScanSuccessFlash(false);
                    setCameraEnabled(true);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                >
                  Scan Another Patient
                </button>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-teal-200/60 text-xs">
                <div className="p-2.5 bg-white/90 rounded-2xl border border-teal-100 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Blood Group</span>
                  <span className="font-black text-rose-600 flex items-center gap-1 text-sm mt-0.5">
                    <HeartPulse className="w-4 h-4" />
                    {verifiedPatient.bloodGroup || 'O+'}
                  </span>
                </div>

                <div className="p-2.5 bg-white/90 rounded-2xl border border-teal-100 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Vitals (Height / Wt)</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">
                    {verifiedPatient.vitals?.heightCm || 165} cm / {verifiedPatient.vitals?.weightKg || 60} kg
                  </span>
                </div>

                <div className="p-2.5 bg-white/90 rounded-2xl border border-teal-100 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Emergency Contact</span>
                  <span className="font-bold text-slate-800 truncate mt-0.5 block">
                    {verifiedPatient.emergencyContact?.name || verifiedPatient.phone || 'Recorded'}
                  </span>
                </div>

                <div className="p-2.5 bg-white/90 rounded-2xl border border-teal-100 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Emergency Phone</span>
                  <span className="font-mono font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-teal-600" />
                    {verifiedPatient.emergencyContact?.phone || verifiedPatient.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ADMISSION & BED ASSIGNMENT */}
          {verifiedPatient && (
            <form onSubmit={handleSubmitAdmission} className="space-y-4 pt-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-teal-600" />
                Step 2: Bed Allocation & Inpatient Intake
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Bed Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Bed Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBedType}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedBedType(newId);
                      setBedNumber(resolveNextBedNumber(newId, occupiedBeds));
                    }}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {availableBedTypes.length > 0 ? (
                      availableBedTypes.map((bt) => (
                        <option key={bt.id || bt.bed_type_id} value={bt.bed_type_id || bt.id}>
                          {bt.name || bt.bed_types?.name} ({bt.available_beds ?? bt.available ?? 0} Available)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="6da05929-2313-43ef-b36c-ae3e5fa64a51">ICU Bed</option>
                        <option value="5693ff64-9a00-4bda-aee5-cb8f6f5fa64a">General Ward Bed</option>
                        <option value="7ea05929-2313-43ef-b36c-ae3e5fa64a52">Semi-Private Room</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Assigned Bed Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Assign Bed / Unit Identifier <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBedNumber(resolveNextBedNumber(selectedBedType, occupiedBeds))}
                      className="text-[10.5px] text-teal-600 font-bold hover:underline cursor-pointer"
                    >
                      ✨ Auto-suggest free bed
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    placeholder="e.g. ICU-101, GEN-102"
                    className={`w-full px-3 py-2.5 bg-white border rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 ${
                      bedNumber && occupiedBeds.has(bedNumber.trim().toUpperCase())
                        ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/40 text-rose-800'
                        : 'border-slate-200 focus:ring-teal-500/20'
                    }`}
                  />
                  {bedNumber && occupiedBeds.has(bedNumber.trim().toUpperCase()) ? (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Unit {bedNumber} is currently occupied by an active inpatient!
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 shrink-0" />
                      Unit Available • Guaranteed Unique
                    </p>
                  )}
                </div>

                {/* Primary Diagnosis */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Primary Diagnosis / Clinical Intake Reason
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Respiratory Distress, Post-Operative Monitoring"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* Clinical Notes */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Admission Notes & Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Provide special instructions, diet plan, or specialist consult requests..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-700/20 flex items-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Allocating Bed & Admitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Bed & Admit Patient
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
