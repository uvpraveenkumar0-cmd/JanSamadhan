-- ═══════════════════════════════════════════════════════════════════════════
-- JanSamadhan Innovation Hub — Evidence System Migration
-- Migration 001: Problem Evidence Table + Storage Bucket + RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this against your Supabase project when you're ready to connect
-- a real backend. This creates the evidence metadata table, storage
-- bucket, and row-level security policies.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Create the problem_evidence table ────────────────────────────────

CREATE TABLE IF NOT EXISTS problem_evidence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id    TEXT NOT NULL,               -- FK to your problems table
  uploaded_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  file_type     TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  file_size     BIGINT NOT NULL CHECK (file_size > 0),
  storage_bucket TEXT NOT NULL DEFAULT 'problem-evidence',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,                  -- for video files
  thumbnail_path TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_problem_evidence_problem_id ON problem_evidence(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_evidence_uploaded_by ON problem_evidence(uploaded_by);

-- ─── 2. Enable RLS ──────────────────────────────────────────────────────

ALTER TABLE problem_evidence ENABLE ROW LEVEL SECURITY;

-- ─── 3. RLS Policies ────────────────────────────────────────────────────

-- Citizens can read their own evidence
CREATE POLICY "Citizens can read own evidence"
  ON problem_evidence FOR SELECT
  USING (auth.uid() = uploaded_by);

-- Citizens can insert their own evidence
CREATE POLICY "Citizens can insert own evidence"
  ON problem_evidence FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Citizens can delete their own evidence (before submission is finalized)
CREATE POLICY "Citizens can delete own evidence"
  ON problem_evidence FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Government officers can read all evidence (for verification)
-- Adjust this policy based on your role system
-- CREATE POLICY "Government can read all evidence"
--   ON problem_evidence FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role IN ('government', 'government_officer', 'government_admin', 'super_admin')
--     )
--   );

-- ─── 4. Storage Bucket ──────────────────────────────────────────────────
-- Run these in the Supabase Dashboard > Storage, or via the API

-- Create the bucket (if not using the dashboard):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('problem-evidence', 'problem-evidence', false);

-- Storage Policies (configure in Supabase Dashboard > Storage > Policies):
--
-- UPLOAD: Authenticated users can upload to their own folder
--   bucket_id = 'problem-evidence'
--   operation = INSERT
--   policy: (auth.uid()::text = (storage.foldername(name))[1])
--
-- READ: Authenticated users can read their own files
--   bucket_id = 'problem-evidence'
--   operation = SELECT
--   policy: (auth.uid()::text = (storage.foldername(name))[1])
--
-- DELETE: Authenticated users can delete their own files
--   bucket_id = 'problem-evidence'
--   operation = DELETE
--   policy: (auth.uid()::text = (storage.foldername(name))[1])

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
