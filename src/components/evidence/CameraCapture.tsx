import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { createEvidenceFile } from '../../services/evidenceService';
import type { EvidenceFile } from '../../types/evidenceTypes';

interface CameraCaptureProps {
  onCapture: (file: EvidenceFile) => void;
  onClose: () => void;
}

type CameraStep = 'requesting' | 'preview' | 'captured' | 'error';

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<CameraStep>('requesting');
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Request camera access
  const startCamera = useCallback(async () => {
    setStep('requesting');
    setErrorMessage('');

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStep('error');
      setErrorMessage('Camera is not supported in this browser. You can upload a photo instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStep('preview');
    } catch (err) {
      setStep('error');
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings, or upload a photo instead.');
            break;
          case 'NotFoundError':
            setErrorMessage('No camera found on this device. You can upload a photo instead.');
            break;
          case 'NotReadableError':
            setErrorMessage('Camera is in use by another application. Please close other apps using the camera and try again.');
            break;
          case 'OverconstrainedError':
            setErrorMessage('Camera does not support the required settings. You can upload a photo instead.');
            break;
          default:
            setErrorMessage(`Camera error: ${err.message}. You can upload a photo instead.`);
        }
      } else {
        setErrorMessage('Could not access the camera. You can upload a photo instead.');
      }
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setErrorMessage('Failed to capture photo. Please try again.');
          return;
        }

        // Stop the camera stream after capturing
        stopCamera();

        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
        setCapturedBlob(blob);
        setStep('captured');
      },
      'image/jpeg',
      0.92,
    );
  }, [stopCamera]);

  // Retake photo
  const retake = useCallback(() => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedUrl(null);
    setCapturedBlob(null);
    startCamera();
  }, [capturedUrl, startCamera]);

  // Accept captured photo
  const acceptPhoto = useCallback(() => {
    if (!capturedBlob) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File([capturedBlob], `camera-photo-${timestamp}.jpg`, {
      type: 'image/jpeg',
    });

    const evidenceFile = createEvidenceFile(file, 'camera');

    // Clean up the temporary preview URL (the EvidenceFile will create its own)
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }

    onCapture(evidenceFile);
    onClose();
  }, [capturedBlob, capturedUrl, onCapture, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    stopCamera();
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    onClose();
  }, [stopCamera, capturedUrl, onClose]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-label="Camera capture">
      <div className="relative w-full max-w-lg bg-surface-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-800">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary-400" />
            <span className="text-sm font-semibold text-white">Take Photo</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close camera"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
          {/* Requesting permission */}
          {step === 'requesting' && (
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-surface-300">Requesting camera access...</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center px-6 max-w-sm">
              <AlertCircle size={40} className="text-danger-400 mx-auto mb-3" />
              <p className="text-sm text-surface-200 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Live Preview */}
          {step === 'preview' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              aria-label="Camera live preview"
            />
          )}

          {/* Captured Photo */}
          {step === 'captured' && capturedUrl && (
            <img
              src={capturedUrl}
              alt="Captured photo"
              className="w-full h-full object-contain"
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 bg-surface-800">
          {step === 'preview' && (
            <button
              type="button"
              onClick={capturePhoto}
              className={cn(
                'w-16 h-16 rounded-full border-4 border-white bg-white/20',
                'flex items-center justify-center',
                'hover:bg-white/30 active:scale-95 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-800',
              )}
              aria-label="Capture photo"
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>
          )}

          {step === 'captured' && (
            <>
              <button
                type="button"
                onClick={retake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-700 text-white text-sm font-medium hover:bg-surface-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Retake photo"
              >
                <RotateCcw size={16} />
                Retake
              </button>
              <button
                type="button"
                onClick={acceptPhoto}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success-600 text-white text-sm font-medium hover:bg-success-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500"
                aria-label="Use this photo"
              >
                <Check size={16} />
                Use Photo
              </button>
            </>
          )}

          {step === 'error' && (
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg bg-surface-700 text-white text-sm font-medium hover:bg-surface-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
