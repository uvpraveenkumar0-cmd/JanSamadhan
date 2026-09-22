import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, X, Check, RotateCcw, Square, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { createEvidenceFile } from '../../services/evidenceService';
import type { EvidenceFile } from '../../types/evidenceTypes';
import { MAX_VIDEO_DURATION_SECONDS } from '../../types/evidenceTypes';

interface VideoRecorderProps {
  onRecorded: (file: EvidenceFile) => void;
  onClose: () => void;
}

type RecorderStep = 'requesting' | 'ready' | 'recording' | 'preview' | 'error';

export function VideoRecorder({ onRecorded, onClose }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState<RecorderStep>('requesting');
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Request camera + microphone access
  const startCamera = useCallback(async () => {
    setStep('requesting');
    setErrorMessage('');

    // Check API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStep('error');
      setErrorMessage('Video recording is not supported in this browser. You can upload a video file instead.');
      return;
    }

    // Check MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
      setStep('error');
      setErrorMessage('Video recording is not supported in this browser. You can upload a video file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStep('ready');
    } catch (err) {
      setStep('error');
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setErrorMessage('Camera/microphone permission was denied. Please allow access in your browser settings, or upload a video file instead.');
            break;
          case 'NotFoundError':
            setErrorMessage('No camera or microphone found on this device. You can upload a video file instead.');
            break;
          case 'NotReadableError':
            setErrorMessage('Camera or microphone is in use by another application. Please close other apps and try again.');
            break;
          default:
            setErrorMessage(`Recording error: ${err.message}. You can upload a video file instead.`);
        }
      } else {
        setErrorMessage('Could not access the camera. You can upload a video file instead.');
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

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsed(0);

    // Determine supported MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);

        stopCamera();
        setRecordedBlob(blob);
        setPreviewUrl(url);
        setStep('preview');
      };

      recorder.onerror = () => {
        stopTimer();
        setStep('error');
        setErrorMessage('Recording failed. Please try again or upload a video file instead.');
      };

      recorderRef.current = recorder;
      recorder.start(1000); // Collect data every second
      setStep('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= MAX_VIDEO_DURATION_SECONDS) {
            // Auto-stop at max duration
            recorder.stop();
            stopTimer();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setStep('error');
      setErrorMessage('Failed to start recording. Your browser may not support video recording. You can upload a video file instead.');
    }
  }, [stopCamera, stopTimer]);

  // Stop recording
  const stopRecording = useCallback(() => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, [stopTimer]);

  // Retake
  const retake = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    startCamera();
  }, [previewUrl, startCamera]);

  // Accept recorded video
  const acceptVideo = useCallback(() => {
    if (!recordedBlob) return;

    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const mimeType = recordedBlob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File([recordedBlob], `recorded-video-${timestamp}.${ext}`, {
      type: mimeType,
    });

    const evidenceFile = createEvidenceFile(file, 'video_recorder');
    // Add duration metadata
    if (evidenceFile.metadata) {
      evidenceFile.metadata.durationSeconds = elapsed;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    onRecorded(evidenceFile);
    onClose();
  }, [recordedBlob, elapsed, previewUrl, onRecorded, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    stopTimer();
    stopRecording();
    stopCamera();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  }, [stopTimer, stopRecording, stopCamera, previewUrl, onClose]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopTimer();
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-label="Video recorder">
      <div className="relative w-full max-w-lg bg-surface-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-800">
          <div className="flex items-center gap-2">
            <Video size={18} className="text-purple-400" />
            <span className="text-sm font-semibold text-white">Record Video</span>
            {step === 'recording' && (
              <span className="flex items-center gap-1.5 ml-2">
                <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
                <span className="text-xs font-mono text-danger-400">Recording</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close recorder"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video View */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
          {/* Requesting permission */}
          {step === 'requesting' && (
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-surface-300">Requesting camera & microphone access...</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center px-6 max-w-sm">
              <AlertCircle size={40} className="text-danger-400 mx-auto mb-3" />
              <p className="text-sm text-surface-200 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Live Preview / Recording */}
          {(step === 'ready' || step === 'recording') && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                aria-label="Camera live preview"
              />
              {/* Timer overlay */}
              {step === 'recording' && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
                  <span className="text-sm font-mono font-semibold text-white tabular-nums">
                    {formatTime(elapsed)}
                  </span>
                  <span className="text-xs text-surface-400">/ {formatTime(MAX_VIDEO_DURATION_SECONDS)}</span>
                </div>
              )}
            </>
          )}

          {/* Preview recorded video */}
          {step === 'preview' && previewUrl && (
            <video
              ref={previewVideoRef}
              src={previewUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              aria-label="Recorded video preview"
            >
              <track kind="captions" />
            </video>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 bg-surface-800">
          {step === 'ready' && (
            <button
              type="button"
              onClick={startRecording}
              className={cn(
                'w-16 h-16 rounded-full border-4 border-danger-500 bg-danger-500/20',
                'flex items-center justify-center',
                'hover:bg-danger-500/30 active:scale-95 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-800',
              )}
              aria-label="Start recording"
            >
              <div className="w-6 h-6 rounded-full bg-danger-500" />
            </button>
          )}

          {step === 'recording' && (
            <button
              type="button"
              onClick={stopRecording}
              className={cn(
                'w-16 h-16 rounded-full border-4 border-danger-500 bg-danger-500/20',
                'flex items-center justify-center',
                'hover:bg-danger-500/30 active:scale-95 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-800',
              )}
              aria-label="Stop recording"
            >
              <Square size={22} className="text-danger-500" fill="currentColor" />
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={retake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-700 text-white text-sm font-medium hover:bg-surface-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Retake video"
              >
                <RotateCcw size={16} />
                Retake
              </button>
              <button
                type="button"
                onClick={acceptVideo}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success-600 text-white text-sm font-medium hover:bg-success-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500"
                aria-label="Use this video"
              >
                <Check size={16} />
                Use Video
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

        {/* Recording info */}
        {step === 'ready' && (
          <div className="flex items-center justify-center gap-2 px-4 pb-3 bg-surface-800">
            <Clock size={12} className="text-surface-500" />
            <span className="text-xs text-surface-400">Max duration: {MAX_VIDEO_DURATION_SECONDS} seconds</span>
          </div>
        )}
      </div>
    </div>
  );
}
