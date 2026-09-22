// ─── Evidence Types & Constants ─────────────────────────────────────────────
// Real evidence types for the JIH citizen problem submission flow.
// No mock/demo types. Every type represents actual application state.

// ─── Upload Status ──────────────────────────────────────────────────────────

export type EvidenceUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export type EvidenceFileType = 'image' | 'video' | 'document';

// ─── Evidence File (client-side, before/during submission) ──────────────────

export interface EvidenceFile {
  /** Unique client-side ID for this evidence item */
  id: string;
  /** The actual browser File object */
  file: File;
  /** Classified file type */
  type: EvidenceFileType;
  /** MIME type from the File object */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Object URL for preview (created via URL.createObjectURL) */
  previewUrl: string;
  /** Current upload status */
  uploadStatus: EvidenceUploadStatus;
  /** Storage path after upload (set after successful upload) */
  storagePath?: string;
  /** Original file name from the user's device */
  originalFileName: string;
  /** Sanitized file name for storage */
  fileName: string;
  /** Optional metadata */
  metadata?: {
    /** Duration in seconds for video files */
    durationSeconds?: number;
    /** Width for images/videos */
    width?: number;
    /** Height for images/videos */
    height?: number;
    /** Source: 'file_picker' | 'camera' | 'video_recorder' */
    source: 'file_picker' | 'camera' | 'video_recorder';
  };
}

// ─── Evidence Metadata (persisted after submission) ─────────────────────────

export interface EvidenceMetadata {
  id: string;
  problemId: string;
  uploadedBy: string;
  storagePath: string;
  originalFileName: string;
  fileName: string;
  mimeType: string;
  fileType: EvidenceFileType;
  fileSize: number;
  storageBucket: string;
  createdAt: string;
  durationSeconds?: number;
  thumbnailPath?: string;
}

// ─── Camera State ───────────────────────────────────────────────────────────

export type CameraStatus =
  | 'idle'
  | 'requesting_permission'
  | 'active'
  | 'captured'
  | 'error';

export interface CameraState {
  status: CameraStatus;
  errorMessage?: string;
  stream?: MediaStream;
}

// ─── Video Recorder State ───────────────────────────────────────────────────

export type RecorderStatus =
  | 'idle'
  | 'requesting_permission'
  | 'ready'
  | 'recording'
  | 'stopped'
  | 'error';

export interface VideoRecorderState {
  status: RecorderStatus;
  errorMessage?: string;
  elapsedSeconds: number;
  stream?: MediaStream;
  recordedBlob?: Blob;
  previewUrl?: string;
}

// ─── Configurable Constants ─────────────────────────────────────────────────
// All limits are centralized here. Modify these values to adjust limits.

/** Maximum file size for images in bytes (10 MB) */
export const IMAGE_MAX_SIZE = 10 * 1024 * 1024;

/** Maximum file size for videos in bytes (100 MB) */
export const VIDEO_MAX_SIZE = 100 * 1024 * 1024;

/** Maximum file size for documents in bytes (20 MB) */
export const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024;

/** Maximum number of evidence files per problem */
export const MAX_EVIDENCE_FILES = 5;

/** Maximum video recording duration in seconds */
export const MAX_VIDEO_DURATION_SECONDS = 60;

/** Supabase storage bucket name for evidence */
export const EVIDENCE_BUCKET = 'problem-evidence';

// ─── Allowed MIME Types ─────────────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
] as const;

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

/** Accept string for the file input (images) */
export const ACCEPT_IMAGES = ALLOWED_IMAGE_TYPES.join(',');

/** Accept string for the file input (videos) */
export const ACCEPT_VIDEOS = ALLOWED_VIDEO_TYPES.join(',');

/** Accept string for the file input (documents) */
export const ACCEPT_DOCUMENTS = ALLOWED_DOCUMENT_TYPES.join(',');

/** Accept string for all evidence files */
export const ACCEPT_ALL = ALL_ALLOWED_TYPES.join(',');

// ─── File Extension Validation Map ─────────────────────────────────────────

export const ALLOWED_EXTENSIONS: Record<string, EvidenceFileType> = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
  '.mp4': 'video',
  '.webm': 'video',
  '.mov': 'video',
  '.pdf': 'document',
};

// ─── Human-Readable Labels ─────────────────────────────────────────────────

export const FILE_TYPE_LABELS: Record<EvidenceFileType, string> = {
  image: 'Image',
  video: 'Video',
  document: 'PDF Document',
};

export const MAX_SIZE_LABELS: Record<EvidenceFileType, string> = {
  image: `${IMAGE_MAX_SIZE / (1024 * 1024)} MB`,
  video: `${VIDEO_MAX_SIZE / (1024 * 1024)} MB`,
  document: `${DOCUMENT_MAX_SIZE / (1024 * 1024)} MB`,
};
