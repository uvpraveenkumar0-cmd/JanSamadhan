// ─── AI Report Types & Zod Validation ───────────────────────────────────────
// Structured types for the complete AI problem analysis report.
// Every value comes from actual analysis — no hardcoded mock data.

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────────────────────────

export type AIVerificationStatus =
  | 'ASSESSED'
  | 'NEEDS_REVIEW'
  | 'INSUFFICIENT_INFORMATION'
  | 'POSSIBLE_DUPLICATE';

export type AIDuplicateStatus =
  | 'UNIQUE'
  | 'POSSIBLE_DUPLICATE'
  | 'LIKELY_DUPLICATE';

export type AIPriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AIProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

// ─── Processing Stage (for the animated processing screen) ──────────────────

export type AIProcessingStage =
  | 'received'
  | 'understanding'
  | 'categorizing'
  | 'summarizing'
  | 'checking_duplicates'
  | 'assessing_priority'
  | 'verification';

export const AI_PROCESSING_STAGES: Array<{ key: AIProcessingStage; label: string }> = [
  { key: 'received', label: 'Problem received' },
  { key: 'understanding', label: 'Understanding the problem' },
  { key: 'categorizing', label: 'Categorizing the problem' },
  { key: 'summarizing', label: 'Creating summary' },
  { key: 'checking_duplicates', label: 'Checking similar problems' },
  { key: 'assessing_priority', label: 'Assessing priority' },
  { key: 'verification', label: 'Performing verification assessment' },
];

// ─── Sub-sections ───────────────────────────────────────────────────────────

export interface AIClassification {
  domain: string;
  domainLabel: string;
  subcategory: string;
  keywords: string[];
  requiredExpertise: string[];
  suggestedDepartment?: string;
}

export interface AIVerification {
  status: AIVerificationStatus;
  confidence: number; // 0–100
  explanation: string;
}

export interface AICompleteness {
  score: number; // 0–100
  providedFields: string[];
  missingInformation: string[];
  consistencyFlags: string[];
}

export interface AIPriority {
  level: AIPriorityLevel;
  score: number; // 0–100
  reason: string;
  factors: Array<{ name: string; impact: string; weight: number }>;
}

export interface AIDuplicateDetection {
  status: AIDuplicateStatus;
  confidence: number; // 0–100
  similarProblems: Array<{
    id: string;
    title: string;
    similarity: number; // 0–100
    status: string;
  }>;
  explanation: string;
}

// ─── Full AI Report ─────────────────────────────────────────────────────────

export interface AIReport {
  id: string;
  problemId: string;
  summary: string;
  classification: AIClassification;
  verification: AIVerification;
  completeness: AICompleteness;
  priority: AIPriority;
  duplicateDetection: AIDuplicateDetection;
  aiExplanation: string;
  recommendedAction: string;
  processingStatus: AIProcessingStatus;
  analyzedAt: string;
  disclaimer: string;
}

// ─── Zod Validation Schema ──────────────────────────────────────────────────

export const aiClassificationSchema = z.object({
  domain: z.string().min(1),
  domainLabel: z.string().min(1),
  subcategory: z.string().min(1),
  keywords: z.array(z.string()),
  requiredExpertise: z.array(z.string()),
  suggestedDepartment: z.string().optional(),
});

export const aiVerificationSchema = z.object({
  status: z.enum(['ASSESSED', 'NEEDS_REVIEW', 'INSUFFICIENT_INFORMATION', 'POSSIBLE_DUPLICATE']),
  confidence: z.number().min(0).max(100),
  explanation: z.string().min(1),
});

export const aiCompletenessSchema = z.object({
  score: z.number().min(0).max(100),
  providedFields: z.array(z.string()),
  missingInformation: z.array(z.string()),
  consistencyFlags: z.array(z.string()),
});

export const aiPrioritySchema = z.object({
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  score: z.number().min(0).max(100),
  reason: z.string().min(1),
  factors: z.array(z.object({
    name: z.string(),
    impact: z.string(),
    weight: z.number(),
  })),
});

export const aiDuplicateDetectionSchema = z.object({
  status: z.enum(['UNIQUE', 'POSSIBLE_DUPLICATE', 'LIKELY_DUPLICATE']),
  confidence: z.number().min(0).max(100),
  similarProblems: z.array(z.object({
    id: z.string(),
    title: z.string(),
    similarity: z.number().min(0).max(100),
    status: z.string(),
  })),
  explanation: z.string().min(1),
});

export const aiReportSchema = z.object({
  id: z.string().min(1),
  problemId: z.string().min(1),
  summary: z.string().min(1),
  classification: aiClassificationSchema,
  verification: aiVerificationSchema,
  completeness: aiCompletenessSchema,
  priority: aiPrioritySchema,
  duplicateDetection: aiDuplicateDetectionSchema,
  aiExplanation: z.string().min(1),
  recommendedAction: z.string().min(1),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']),
  analyzedAt: z.string(),
  disclaimer: z.string(),
});
