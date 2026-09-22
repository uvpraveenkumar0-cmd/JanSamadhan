import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description: string;
  acceptedFormats?: string;
  maxSizeMB?: number;
  onFileSelect: (fileName: string, fileSize?: number) => void;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  acceptedFormats = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 5,
  onFileSelect,
  required = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }

    const info = {
      name: file.name,
      size: formatFileSize(file.size),
    };
    setSelectedFile(info);
    onFileSelect(file.name, file.size);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">Max {maxSizeMB}MB</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-800/40'
          }`}
        >
          <div className="flex flex-col items-center">
            <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-1.5" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Click to browse or drag & drop document
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span>{selectedFile.size}</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Ready for upload
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors ml-2"
            title="Remove document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-[11px] text-rose-500 mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
