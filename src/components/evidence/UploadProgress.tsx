import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { EvidenceFile } from '../../types/evidenceTypes';
import { formatFileSize } from '../../services/evidenceService';

interface UploadProgressProps {
  files: EvidenceFile[];
  currentIndex: number;
}

export function UploadProgress({ files, currentIndex }: UploadProgressProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-surface-800">Uploading evidence...</p>

      {files.map((file, i) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-100"
        >
          {/* Status icon */}
          {file.uploadStatus === 'uploading' || (file.uploadStatus === 'pending' && i === currentIndex) ? (
            <Loader2 size={18} className="text-primary-500 animate-spin shrink-0" />
          ) : file.uploadStatus === 'uploaded' ? (
            <CheckCircle2 size={18} className="text-success-500 shrink-0" />
          ) : file.uploadStatus === 'failed' ? (
            <AlertCircle size={18} className="text-danger-500 shrink-0" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-surface-300 shrink-0" />
          )}

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-surface-700 truncate">{file.originalFileName}</p>
            <p className="text-xs text-surface-400">
              {formatFileSize(file.size)}
            </p>
          </div>

          {/* Status text */}
          <span className="text-xs font-medium shrink-0">
            {file.uploadStatus === 'uploading' || (file.uploadStatus === 'pending' && i === currentIndex) ? (
              <span className="text-primary-600">Uploading...</span>
            ) : file.uploadStatus === 'uploaded' ? (
              <span className="text-success-600">Uploaded</span>
            ) : file.uploadStatus === 'failed' ? (
              <span className="text-danger-600">Failed</span>
            ) : (
              <span className="text-surface-400">Waiting</span>
            )}
          </span>
        </div>
      ))}

      {/* Counter */}
      <p className="text-xs text-surface-500 text-center">
        {files.filter(f => f.uploadStatus === 'uploaded').length} of {files.length} files uploaded
      </p>
    </div>
  );
}
