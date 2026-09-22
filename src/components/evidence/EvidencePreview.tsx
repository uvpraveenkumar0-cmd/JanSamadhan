import React from 'react';
import { X, Image, Video, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatFileSize } from '../../services/evidenceService';
import type { EvidenceFile } from '../../types/evidenceTypes';
import { FILE_TYPE_LABELS } from '../../types/evidenceTypes';

interface EvidencePreviewProps {
  evidence: EvidenceFile;
  onRemove: (id: string) => void;
  compact?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  image: <Image size={20} className="text-primary-500" />,
  video: <Video size={20} className="text-purple-500" />,
  document: <FileText size={20} className="text-orange-500" />,
};

export function EvidencePreview({ evidence, onRemove, compact }: EvidencePreviewProps) {
  return (
    <div
      className={cn(
        'group relative bg-white border border-surface-200 rounded-xl overflow-hidden',
        'transition-all duration-200 hover:border-surface-300 hover:shadow-sm',
        compact ? 'flex items-center gap-3 p-3' : 'flex flex-col',
      )}
    >
      {/* Preview Area */}
      {!compact && (
        <div className="relative w-full aspect-video bg-surface-50 flex items-center justify-center overflow-hidden">
          {evidence.type === 'image' && (
            <img
              src={evidence.previewUrl}
              alt={evidence.originalFileName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {evidence.type === 'video' && (
            <video
              src={evidence.previewUrl}
              controls
              preload="metadata"
              className="w-full h-full object-contain bg-black"
              aria-label={`Video preview: ${evidence.originalFileName}`}
            >
              <track kind="captions" />
            </video>
          )}
          {evidence.type === 'document' && (
            <div className="flex flex-col items-center gap-2 p-4">
              <FileText size={40} className="text-orange-400" />
              <span className="text-xs text-surface-500 font-medium">PDF Document</span>
            </div>
          )}

          {/* Upload status overlay */}
          {evidence.uploadStatus === 'uploading' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {evidence.uploadStatus === 'failed' && (
            <div className="absolute inset-0 bg-danger-500/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-danger-700 bg-white/90 px-2 py-1 rounded">Upload Failed</span>
            </div>
          )}
        </div>
      )}

      {/* Compact preview (icon only) */}
      {compact && evidence.type === 'image' && (
        <img
          src={evidence.previewUrl}
          alt={evidence.originalFileName}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
          loading="lazy"
        />
      )}
      {compact && evidence.type === 'video' && (
        <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
          <Video size={20} className="text-purple-500" />
        </div>
      )}
      {compact && evidence.type === 'document' && (
        <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <FileText size={20} className="text-orange-500" />
        </div>
      )}

      {/* File Info */}
      <div className={cn('flex-1 min-w-0', compact ? '' : 'p-3')}>
        <div className="flex items-start gap-2">
          {!compact && typeIcons[evidence.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-800 truncate" title={evidence.originalFileName}>
              {evidence.originalFileName}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              {FILE_TYPE_LABELS[evidence.type]} • {formatFileSize(evidence.size)}
              {evidence.metadata?.durationSeconds != null && (
                <> • {evidence.metadata.durationSeconds}s</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(evidence.id)}
        className={cn(
          'flex items-center justify-center rounded-lg transition-all',
          'text-surface-400 hover:text-danger-600 hover:bg-danger-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500',
          compact
            ? 'w-8 h-8 shrink-0'
            : 'absolute top-2 right-2 w-7 h-7 bg-white/90 shadow-sm opacity-0 group-hover:opacity-100',
        )}
        aria-label={`Remove ${evidence.originalFileName}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
