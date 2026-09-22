import React from 'react';
import { ImageOff } from 'lucide-react';
import { EvidencePreview } from './EvidencePreview';
import type { EvidenceFile } from '../../types/evidenceTypes';
import { MAX_EVIDENCE_FILES } from '../../types/evidenceTypes';

interface EvidenceListProps {
  files: EvidenceFile[];
  onRemove: (id: string) => void;
  compact?: boolean;
}

export function EvidenceList({ files, onRemove, compact }: EvidenceListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-6">
        <ImageOff size={32} className="text-surface-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-surface-500">No evidence added yet</p>
        <p className="text-xs text-surface-400 mt-1">
          Photos, videos, or documents can help verify your reported problem.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-surface-600 uppercase tracking-wider">
          Evidence Added
        </p>
        <span className="text-xs text-surface-400">
          {files.length} of {MAX_EVIDENCE_FILES} files
        </span>
      </div>

      {compact ? (
        <div className="space-y-2">
          {files.map(f => (
            <EvidencePreview key={f.id} evidence={f} onRemove={onRemove} compact />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map(f => (
            <EvidencePreview key={f.id} evidence={f} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
