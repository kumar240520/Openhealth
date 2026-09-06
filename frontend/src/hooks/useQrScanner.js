/**
 * useQrScanner — Leak-Proof, High-Performance QR Scanner Hook
 * 
 * Features:
 * 1. Native BarcodeDetector API for fast, hardware-accelerated scanning with fallback to html5-qrcode.
 * 2. Instant Camera Shut-Off on QR detection: The camera shuts off the millisecond a valid code is read.
 * 3. Zero Leak Guarantee: Every MediaStream is registered and explicitly stopped when inactive or unmounting.
 * 4. Stable Lifecycle: Prevents effect loops by avoiding unstable object dependencies in React lifecycle.
 * 5. WebRTC Best Practice: Requests getUserMedia first to trigger permission dialog, then enumerates devices.
 * 6. Background safety: Shuts off camera tracks on tab visibility change (hidden) or page unload.
 */
import { useRef, useState, useCallback, useEffect } from 'react';

// Check if native BarcodeDetector API is available
const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

/**
 * Play a subtle beep using Web Audio API and cleanly close the audio context
 */
export function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') ctx.close();
      } catch (e) { /* ignore */ }
    }, 250);
  } catch (e) {
    // Audio context not allowed or unsupported
  }
}

/**
 * Extract clean UUID or ABHA ID from various potential QR payload formats
 */
export function extractPatientIdentifier(rawText) {
  if (!rawText) return '';
  let str = String(rawText).trim();

  // 1. Try JSON parse
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === 'object') {
      const candidate = parsed.patientUid || parsed.userId || parsed.abhaId || parsed.id || parsed.uid;
      if (candidate) return String(candidate).trim();
    }
  } catch (e) { /* not JSON */ }

  // 2. UUID pattern
  const uuidMatch = str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0];

  // 3. ABHA ID format (e.g., 91-7705-2080-4113)
  const abhaMatch = str.match(/\b\d{2}-\d{4}-\d{4}-\d{4}\b/);
  if (abhaMatch) return abhaMatch[0];

  // 4. URL with query params or path segments
  if (str.includes('/') || str.includes('?')) {
    try {
      const url = new URL(str, window.location.origin);
      const qUid = url.searchParams.get('uid') || url.searchParams.get('id') || url.searchParams.get('patientUid');
      if (qUid) return qUid.trim();
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (last.length >= 8) return last;
      }
    } catch (e) { /* invalid URL */ }
  }

  // 5. Strip prefix labels
  str = str.replace(/^(uid|abha|patient|id):\s*/i, '').trim();

  return str;
}

/**
 * Helper to forcefully kill all tracks on a MediaStream
 */
function killStreamTracks(stream) {
  if (!stream) return;
  try {
    if (typeof stream.getTracks === 'function') {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) { /* ignore */ }
      });
    }
  } catch (e) { /* ignore */ }
}

/**
 * useQrScanner Hook
 */
export default function useQrScanner({ videoContainerId, onScan, active = false }) {
  const [scanning, setScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');

  // Refs for bulletproof lifecycle management
  const activeStreamsRef = useRef(new Set());
  const sessionRef = useRef(0);
  const shouldBeActiveRef = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const lockedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const html5QrRef = useRef(null);

  // Keep callback ref current without triggering re-runs
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  /**
   * Stop all camera streams, video elements, and detection loops immediately
   */
  const stopScanner = useCallback(async () => {
    sessionRef.current += 1;
    shouldBeActiveRef.current = false;

    // 1. Cancel requestAnimationFrame detection loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 2. Stop html5-qrcode fallback if active
    if (html5QrRef.current) {
      const instance = html5QrRef.current;
      html5QrRef.current = null;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
      } catch (e) { /* ignore */ }
      try {
        instance.clear();
      } catch (e) { /* ignore */ }
    }

    // 3. Force-stop all registered MediaStreams & tracks
    activeStreamsRef.current.forEach(stream => {
      killStreamTracks(stream);
    });
    activeStreamsRef.current.clear();

    // 4. Force release on active video element
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        if (videoRef.current.srcObject) {
          killStreamTracks(videoRef.current.srcObject);
        }
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
        videoRef.current.remove();
      } catch (e) { /* ignore */ }
      videoRef.current = null;
    }

    // 5. Clean any leftover video elements inside the target container
    const container = document.getElementById(videoContainerId);
    if (container) {
      try {
        container.querySelectorAll('video').forEach(v => {
          try {
            if (v.srcObject) killStreamTracks(v.srcObject);
            v.pause();
            v.srcObject = null;
          } catch (e) { /* ignore */ }
        });
        container.innerHTML = '';
      } catch (e) { /* ignore */ }
    }

    setIsStarting(false);
    setScanning(false);
    lockedRef.current = false;
  }, [videoContainerId]);

  /**
   * Start native BarcodeDetector scanner
   */
  const startNativeScanner = useCallback(async (thisSession, cameraId, preloadedStream = null) => {
    const container = document.getElementById(videoContainerId);
    if (!container) return false;

    try {
      let stream = preloadedStream;
      if (!stream) {
        const constraints = cameraId
          ? { video: { deviceId: { exact: cameraId } } }
          : { video: { facingMode: { ideal: 'environment' } } };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) return false;
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      // Check if session was cancelled while getUserMedia was prompting
      if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) {
        killStreamTracks(stream);
        return false;
      }

      activeStreamsRef.current.add(stream);

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.muted = true;
      video.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:16px;display:block;';

      container.innerHTML = '';
      container.appendChild(video);
      videoRef.current = video;

      await video.play();

      if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) {
        await stopScanner();
        return false;
      }

      // Create BarcodeDetector instance
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      detectorRef.current = detector;

      // Detection loop throttled to ~12 fps
      let lastDetectTime = 0;
      const detectLoop = async (timestamp) => {
        if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) return;
        if (!videoRef.current || !detectorRef.current) return;

        if (timestamp - lastDetectTime < 80) {
          animFrameRef.current = requestAnimationFrame(detectLoop);
          return;
        }
        lastDetectTime = timestamp;

        try {
          if (video.readyState >= 2 && !lockedRef.current) {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0 && !lockedRef.current) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue && rawValue.trim()) {
                lockedRef.current = true;
                playScanBeep();

                // IMMEDIATELY SHUT OFF CAMERA HARDWARE ACCESS
                await stopScanner();

                if (onScanRef.current) {
                  onScanRef.current(rawValue.trim());
                }
                return;
              }
            }
          }
        } catch (e) {
          // Frame detection glitch, continue
        }

        if (sessionRef.current === thisSession && shouldBeActiveRef.current) {
          animFrameRef.current = requestAnimationFrame(detectLoop);
        }
      };

      animFrameRef.current = requestAnimationFrame(detectLoop);
      return true;
    } catch (err) {
      console.warn('Native BarcodeDetector setup failed:', err);
      return false;
    }
  }, [videoContainerId, stopScanner]);

  /**
   * Start fallback html5-qrcode scanner
   */
  const startHtml5QrScanner = useCallback(async (thisSession, cameraId) => {
    const container = document.getElementById(videoContainerId);
    if (!container) return false;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) return false;

      const qrScanner = new Html5Qrcode(videoContainerId, { verbose: false });
      html5QrRef.current = qrScanner;

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      const config = {
        fps: 12,
        qrbox: { width: 250, height: 250 },
        disableFlip: false
      };

      const successCallback = async (decodedText) => {
        if (lockedRef.current) return;
        lockedRef.current = true;
        playScanBeep();

        // IMMEDIATELY SHUT OFF CAMERA HARDWARE ACCESS
        await stopScanner();

        if (onScanRef.current) {
          onScanRef.current(decodedText.trim());
        }
      };

      try {
        await qrScanner.start(cameraConfig, config, successCallback, () => {});
      } catch (firstErr) {
        if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) return false;
        console.warn('Primary camera failed, trying default user-facing camera:', firstErr);
        await qrScanner.start({ facingMode: 'user' }, config, successCallback, () => {});
      }

      if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) {
        await stopScanner();
        return false;
      }

      return true;
    } catch (e) {
      console.warn('html5-qrcode scanner failed:', e);
      return false;
    }
  }, [videoContainerId, stopScanner]);

  /**
   * Start the camera scanner
   */
  const startScanner = useCallback(async (targetCameraId = null) => {
    // 1. Stop any prior stream cleanly
    await stopScanner();

    // 2. Set new session counter
    const thisSession = ++sessionRef.current;
    shouldBeActiveRef.current = true;
    setIsStarting(true);
    setError(null);
    lockedRef.current = false;

    // 3. Locate container in DOM (retry if rendering modal)
    let container = document.getElementById(videoContainerId);
    if (!container) {
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 50));
        if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) return;
        container = document.getElementById(videoContainerId);
        if (container) break;
      }
      if (!container) {
        setIsStarting(false);
        setError('Scanner container not ready in DOM');
        return;
      }
    }

    // 4. Request camera stream first — this triggers browser permission prompt!
    let stream = null;
    try {
      const constraints = targetCameraId
        ? { video: { deviceId: { exact: targetCameraId } } }
        : { video: { facingMode: { ideal: 'environment' } } };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) return;
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
    } catch (permErr) {
      console.warn('getUserMedia error:', permErr);
      if (sessionRef.current === thisSession && shouldBeActiveRef.current) {
        setIsStarting(false);
        setError('Camera permission denied or camera unavailable. Please allow camera permissions in your browser or use manual search / upload.');
      }
      return;
    }

    if (sessionRef.current !== thisSession || !shouldBeActiveRef.current) {
      killStreamTracks(stream);
      return;
    }

    // 5. Now that permission is granted, enumerate available camera devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);

      const activeTrack = stream.getVideoTracks()[0];
      const settings = activeTrack?.getSettings?.();
      if (settings?.deviceId) {
        setActiveCameraId(settings.deviceId);
      }
    } catch (e) {
      console.warn('Cannot enumerate camera devices:', e);
    }

    // 6. Try native BarcodeDetector with the acquired stream
    if (hasBarcodeDetector) {
      const nativeOk = await startNativeScanner(thisSession, targetCameraId, stream);
      if (sessionRef.current === thisSession && shouldBeActiveRef.current) {
        setIsStarting(false);
        if (nativeOk) {
          setScanning(true);
          return;
        }
      }
    }

    // 7. Fallback to html5-qrcode if native scanner is unsupported or failed
    killStreamTracks(stream);
    const fallbackOk = await startHtml5QrScanner(thisSession, targetCameraId);
    if (sessionRef.current === thisSession && shouldBeActiveRef.current) {
      setIsStarting(false);
      if (fallbackOk) {
        setScanning(true);
        return;
      }
    }

    if (sessionRef.current === thisSession && shouldBeActiveRef.current) {
      setIsStarting(false);
      setError('Could not initialize video scanner. Please check camera permissions or use manual ABHA search.');
    }
  }, [stopScanner, startNativeScanner, startHtml5QrScanner, videoContainerId]);

  /**
   * Switch active camera
   */
  const switchCamera = useCallback(async (newCameraId) => {
    setActiveCameraId(newCameraId);
    await startScanner(newCameraId);
  }, [startScanner]);

  /**
   * Reset scan lock
   */
  const resetLock = useCallback(() => {
    lockedRef.current = false;
  }, []);

  /**
   * Decode QR code from a static image file
   */
  const scanFile = useCallback(async (file) => {
    if (!file) return null;
    try {
      // Try native BarcodeDetector
      if (hasBarcodeDetector) {
        const img = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          playScanBeep();
          return barcodes[0].rawValue;
        }
      }

      // Fallback to html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempId = 'qr-file-scan-temp-' + Date.now();
      let tempDiv = document.getElementById(tempId);
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = tempId;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }
      const qr = new Html5Qrcode(tempId, { verbose: false });
      const decodedText = await qr.scanFile(file, true);
      qr.clear();
      tempDiv.remove();
      if (decodedText) {
        playScanBeep();
        return decodedText;
      }
    } catch (e) {
      console.warn('File QR scan failed:', e);
    }
    return null;
  }, []);

  // Store stable refs to startScanner and stopScanner for effect triggers
  const startScannerRef = useRef(startScanner);
  const stopScannerRef = useRef(stopScanner);
  startScannerRef.current = startScanner;
  stopScannerRef.current = stopScanner;

  // Auto-start / auto-stop strictly based on `active` prop
  useEffect(() => {
    if (active) {
      startScannerRef.current();
    } else {
      stopScannerRef.current();
    }
    return () => {
      stopScannerRef.current();
    };
  }, [active]);

  // Handle tab visibility and page navigation to prevent background camera access
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopScannerRef.current();
      } else if (document.visibilityState === 'visible' && activeRef.current) {
        startScannerRef.current();
      }
    };

    const handlePageUnload = () => {
      activeStreamsRef.current.forEach(stream => {
        killStreamTracks(stream);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);
    };
  }, []);

  return {
    scanning,
    isStarting,
    isStopped: !scanning && !isStarting,
    error,
    cameras,
    activeCameraId,
    startScanner,
    stopScanner,
    switchCamera,
    scanFile,
    resetLock,
    isLocked: () => lockedRef.current
  };
}
