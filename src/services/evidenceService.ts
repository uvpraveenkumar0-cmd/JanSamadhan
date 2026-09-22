// ─── Evidence Service ───────────────────────────────────────────────────────
// Real evidence validation, storage, and retrieval.
// Currently uses the existing localStorage db layer.
// Ready to swap to Supabase when a project is configured.

import type {
  EvidenceFile,
  EvidenceFileType,
  EvidenceMetadata,
} from '../types/evidenceTypes';

import {
  IMAGE_MAX_SIZE,
  VIDEO_MAX_SIZE,
  DOCUMENT_MAX_SIZE,
  MAX_EVIDENCE_FILES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_EXTENSIONS,
  FILE_TYPE_LABELS,
  EVIDENCE_BUCKET,
} from '../types/evidenceTypes';

// ─── Storage Key ────────────────────────────────────────────────────────────

const EVIDENCE_STORAGE_KEY = 'jih_problem_evidence_v1';

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Classify a file's type based on its MIME type.
 * Returns null if the file type is not allowed.
 */
export function classifyFileType(mimeType: string): EvidenceFileType | null {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) return 'image';
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType)) return 'video';
  if ((ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType)) return 'document';
  return null;
}

/**
 * Validate a file's extension against the allowed list.
 */
function validateExtension(fileName: string): EvidenceFileType | null {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return ALLOWED_EXTENSIONS[ext] ?? null;
}

/**
 * Get the maximum allowed size for a given file type.
 */
function getMaxSize(type: EvidenceFileType): number {
  switch (type) {
    case 'image': return IMAGE_MAX_SIZE;
    case 'video': return VIDEO_MAX_SIZE;
    case 'document': return DOCUMENT_MAX_SIZE;
  }
}

/**
 * Validate a single file for type, extension, MIME, and size.
 */
export function validateFile(file: File): ValidationResult {
  // 1. Classify by MIME type
  const typeByMime = classifyFileType(file.type);
  if (!typeByMime) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type || 'unknown'}". Allowed: images (JPEG, PNG, WebP), videos (MP4, WebM, MOV), and PDF documents.`,
    };
  }

  // 2. Validate extension matches
  const typeByExt = validateExtension(file.name);
  if (!typeByExt) {
    const ext = file.name.slice(file.name.lastIndexOf('.'));
    return {
      valid: false,
      error: `Unsupported file extension "${ext}". Please use a supported file format.`,
    };
  }

  // 3. Cross-check MIME and extension match the same category
  if (typeByMime !== typeByExt) {
    return {
      valid: false,
      error: `File extension does not match its content type. Expected ${FILE_TYPE_LABELS[typeByExt]} but received ${FILE_TYPE_LABELS[typeByMime]}.`,
    };
  }

  // 4. Validate size
  const maxSize = getMaxSize(typeByMime);
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    const actualMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `${FILE_TYPE_LABELS[typeByMime]} is too large (${actualMB} MB). Maximum allowed size is ${maxMB} MB.`,
    };
  }

  // 5. Reject empty files
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File appears to be empty. Please select a valid file.',
    };
  }

  return { valid: true };
}

/**
 * Validate whether adding more files would exceed the limit.
 */
export function validateFileCount(currentCount: number, newCount: number): ValidationResult {
  if (currentCount + newCount > MAX_EVIDENCE_FILES) {
    return {
      valid: false,
      error: `Maximum ${MAX_EVIDENCE_FILES} evidence files allowed. You already have ${currentCount} file${currentCount !== 1 ? 's' : ''}.`,
    };
  }
  return { valid: true };
}

// ─── File Utilities ─────────────────────────────────────────────────────────

/**
 * Sanitize a filename by removing unsafe characters and path traversal.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w\s.-]/g, '_')    // Replace unsafe chars with underscore
    .replace(/\.{2,}/g, '.')       // No double dots (path traversal)
    .replace(/^\.+/, '')           // No leading dots
    .replace(/\s+/g, '_')         // Spaces to underscores
    .slice(0, 200);               // Limit length
}

/**
 * Generate a unique storage path for an evidence file.
 */
export function generateStoragePath(
  userId: string,
  problemId: string,
  file: File,
): string {
  const uniqueId = crypto.randomUUID();
  const sanitized = sanitizeFileName(file.name);
  return `${userId}/${problemId}/${uniqueId}-${sanitized}`;
}

/**
 * Format bytes into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Create an EvidenceFile object from a browser File.
 */
export function createEvidenceFile(
  file: File,
  source: 'file_picker' | 'camera' | 'video_recorder',
): EvidenceFile {
  const fileType = classifyFileType(file.type) ?? 'document';
  return {
    id: crypto.randomUUID(),
    file,
    type: fileType,
    mimeType: file.type,
    size: file.size,
    previewUrl: URL.createObjectURL(file),
    uploadStatus: 'pending',
    originalFileName: file.name,
    fileName: sanitizeFileName(file.name),
    metadata: { source },
  };
}

/**
 * Revoke the object URL for an evidence file (cleanup).
 */
export function revokeEvidencePreview(evidence: EvidenceFile): void {
  if (evidence.previewUrl) {
    URL.revokeObjectURL(evidence.previewUrl);
  }
}

// ─── Evidence Persistence (localStorage layer) ──────────────────────────────
// When Supabase is configured, replace these functions with real API calls.

function getStoredEvidence(): EvidenceMetadata[] {
  try {
    const raw = localStorage.getItem(EVIDENCE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredEvidence(evidence: EvidenceMetadata[]): void {
  try {
    localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
  } catch (e) {
    console.error('Failed to save evidence metadata:', e);
  }
}

// ─── Evidence Service ───────────────────────────────────────────────────────

export const evidenceService = {
  /**
   * "Upload" evidence files and store metadata.
   * Currently stores metadata in localStorage.
   * When Supabase is configured, this will upload to Storage + insert into PostgreSQL.
   */
  async uploadEvidence(
    files: EvidenceFile[],
    userId: string,
    problemId: string,
  ): Promise<{ success: EvidenceMetadata[]; failed: Array<{ file: EvidenceFile; error: string }> }> {
    const success: EvidenceMetadata[] = [];
    const failed: Array<{ file: EvidenceFile; error: string }> = [];

    for (const evidenceFile of files) {
      try {
        const storagePath = generateStoragePath(userId, problemId, evidenceFile.file);

        const metadata: EvidenceMetadata = {
          id: evidenceFile.id,
          problemId,
          uploadedBy: userId,
          storagePath,
          originalFileName: evidenceFile.originalFileName,
          fileName: evidenceFile.fileName,
          mimeType: evidenceFile.mimeType,
          fileType: evidenceFile.type,
          fileSize: evidenceFile.size,
          storageBucket: EVIDENCE_BUCKET,
          createdAt: new Date().toISOString(),
          durationSeconds: evidenceFile.metadata?.durationSeconds,
        };

        // Store metadata
        const stored = getStoredEvidence();
        stored.push(metadata);
        setStoredEvidence(stored);

        success.push(metadata);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown upload error';
        failed.push({ file: evidenceFile, error: errorMessage });
      }
    }

    return { success, failed };
  },

  /**
   * Get evidence metadata for a specific problem.
   */
  async getEvidenceForProblem(problemId: string): Promise<EvidenceMetadata[]> {
    const all = getStoredEvidence();
    return all.filter(e => e.problemId === problemId);
  },

  /**
   * Delete an evidence record by ID.
   */
  async deleteEvidence(evidenceId: string): Promise<boolean> {
    try {
      const all = getStoredEvidence();
      const filtered = all.filter(e => e.id !== evidenceId);
      setStoredEvidence(filtered);
      return true;
    } catch {
      return false;
    }
  },
};
