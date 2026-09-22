import React, { useState, useCallback } from 'react';
import { Camera, Video, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { revokeEvidencePreview } from '../../services/evidenceService';
import type { EvidenceFile } from '../../types/evidenceTypes';
import { MAX_EVIDENCE_FILES } from '../../types/evidenceTypes';

import { EvidenceUploader } from './EvidenceUploader';
import { EvidenceList } from './EvidenceList';
import { CameraCapture } from './CameraCapture';
import { VideoRecorder } from './VideoRecorder';

interface EvidenceStepProps {
  files: EvidenceFile[];
  onChange: (files: EvidenceFile[]) => void;
}

export function EvidenceStep({ files, onChange }: EvidenceStepProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add files from uploader or camera/recorder
  const handleFilesSelected = useCallback(
    (newFiles: EvidenceFile[]) => {
      setError(null);
      onChange([...files, ...newFiles]);
    },
    [files, onChange],
  );

  // Add a single file (from camera or recorder)
  const handleSingleFile = useCallback(
    (file: EvidenceFile) => {
      if (files.length >= MAX_EVIDENCE_FILES) {
        setError(`Maximum ${MAX_EVIDENCE_FILES} files allowed. Remove an existing file to add more.`);
        return;
      }
      setError(null);
      onChange([...files, file]);
    },
    [files, onChange],
  );

  // Remove a file
  const handleRemove = useCallback(
    (id: string) => {
      const target = files.find(f => f.id === id);
      if (target) {
        revokeEvidencePreview(target);
      }
      onChange(files.filter(f => f.id !== id));
    },
    [files, onChange],
  );

  // Error handler
  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const isMaxReached = files.length >= MAX_EVIDENCE_FILES;

  return (
    <div className="space-y-5">
      {/* Capture Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          disabled={isMaxReached}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'bg-primary-600 text-white transition-all',
            'hover:bg-primary-700 active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-600',
          )}
          aria-label="Take a photo with camera"
        >
          <Camera size={16} />
          Take Photo
        </button>

        <button
          type="button"
          onClick={() => setShowRecorder(true)}
          disabled={isMaxReached}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'bg-purple-600 text-white transition-all',
            'hover:bg-purple-700 active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600',
          )}
          aria-label="Record a video"
        >
          <Video size={16} />
          Record Video
        </button>
      </div>

      {/* File Uploader */}
      <EvidenceUploader
        currentFiles={files}
        onFilesSelected={handleFilesSelected}
        onError={handleError}
      />

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-danger-50 border border-danger-200 rounded-lg" role="alert">
          <AlertCircle size={16} className="text-danger-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-danger-700 whitespace-pre-line">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="w-6 h-6 flex items-center justify-center rounded text-danger-400 hover:text-danger-600 transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Evidence List */}
      <EvidenceList files={files} onRemove={handleRemove} />

      {/* Help text */}
      <p className="text-xs text-surface-400">
        Evidence like photos or documents strengthens your submission and helps government officers verify the problem faster.
      </p>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleSingleFile}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Video Recorder Modal */}
      {showRecorder && (
        <VideoRecorder
          onRecorded={handleSingleFile}
          onClose={() => setShowRecorder(false)}
        />
      )}
    </div>
  );
}
