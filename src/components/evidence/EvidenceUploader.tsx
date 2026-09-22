import React, { useRef, useCallback, useState } from 'react';
import { Upload, Image, Video, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { validateFile, validateFileCount, createEvidenceFile } from '../../services/evidenceService';
import type { EvidenceFile } from '../../types/evidenceTypes';
import {
  ACCEPT_IMAGES,
  ACCEPT_VIDEOS,
  ACCEPT_DOCUMENTS,
  ACCEPT_ALL,
  MAX_EVIDENCE_FILES,
} from '../../types/evidenceTypes';

interface EvidenceUploaderProps {
  currentFiles: EvidenceFile[];
  onFilesSelected: (files: EvidenceFile[]) => void;
  onError: (message: string) => void;
}

export function EvidenceUploader({ currentFiles, onFilesSelected, onError }: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAccept, setActiveAccept] = useState(ACCEPT_ALL);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);

      // Validate total count
      const countResult = validateFileCount(currentFiles.length, files.length);
      if (!countResult.valid) {
        onError(countResult.error!);
        return;
      }

      const validFiles: EvidenceFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const result = validateFile(file);
        if (result.valid) {
          validFiles.push(createEvidenceFile(file, 'file_picker'));
        } else {
          errors.push(`${file.name}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        onError(errors.join('\n'));
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [currentFiles.length, onFilesSelected, onError],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [processFiles],
  );

  const openFilePicker = useCallback(
    (accept: string) => {
      if (currentFiles.length >= MAX_EVIDENCE_FILES) {
        onError(`Maximum ${MAX_EVIDENCE_FILES} files allowed. Remove an existing file to add more.`);
        return;
      }
      setActiveAccept(accept);
      // Need to wait for state update before clicking
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 0);
    },
    [currentFiles.length, onError],
  );

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const isMaxReached = currentFiles.length >= MAX_EVIDENCE_FILES;

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={activeAccept}
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Select evidence files"
        tabIndex={-1}
      />

      {/* Upload buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openFilePicker(ACCEPT_IMAGES)}
          disabled={isMaxReached}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'border border-surface-200 bg-white transition-all',
            'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-surface-200',
          )}
          aria-label="Upload photos"
        >
          <Image size={16} className="text-primary-500" />
          Upload Photos
        </button>

        <button
          type="button"
          onClick={() => openFilePicker(ACCEPT_VIDEOS)}
          disabled={isMaxReached}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'border border-surface-200 bg-white transition-all',
            'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-surface-200',
          )}
          aria-label="Upload videos"
        >
          <Video size={16} className="text-purple-500" />
          Upload Videos
        </button>

        <button
          type="button"
          onClick={() => openFilePicker(ACCEPT_DOCUMENTS)}
          disabled={isMaxReached}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            'border border-surface-200 bg-white transition-all',
            'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-surface-200',
          )}
          aria-label="Upload documents"
        >
          <FileText size={16} className="text-orange-500" />
          Upload Documents
        </button>
      </div>

      {/* Drag & Drop Zone */}
      {!isMaxReached && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => openFilePicker(ACCEPT_ALL)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(ACCEPT_ALL); }}
          aria-label="Drag and drop files here or click to browse"
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary-400 bg-primary-50/60 scale-[1.01]'
              : 'border-surface-250 hover:border-primary-300 hover:bg-primary-50/30',
          )}
        >
          <Upload size={24} className={cn('mx-auto mb-2', isDragging ? 'text-primary-500' : 'text-surface-400')} />
          <p className="text-sm font-medium text-surface-600">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-surface-400 mt-1">
            Images, videos, and PDF documents
          </p>
        </div>
      )}

      {/* Max reached notice */}
      {isMaxReached && (
        <div className="flex items-center gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <AlertCircle size={16} className="text-warning-600 shrink-0" />
          <p className="text-xs text-warning-700">
            Maximum {MAX_EVIDENCE_FILES} files reached. Remove an existing file to add more.
          </p>
        </div>
      )}
    </div>
  );
}
