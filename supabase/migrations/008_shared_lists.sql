-- Migration: 008_shared_lists.sql
-- Purpose: Add shared_lists table for community watchlist sharing

CREATE TABLE IF NOT EXISTS shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  card_ids UUID[] NOT NULL DEFAULT '{}',
  header_image_url TEXT,
  card_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching user's shared lists
CREATE INDEX IF NOT EXISTS idx_shared_lists_user_id ON shared_lists(user_id);

-- Index for fetching public lists ordered by creation date
CREATE INDEX IF NOT EXISTS idx_shared_lists_created_at ON shared_lists(created_at DESC);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_shared_lists_slug ON shared_lists(slug);

-- Enable RLS
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public lists
CREATE POLICY "Anyone can read public shared lists"
  ON shared_lists
  FOR SELECT
  USING (is_public = TRUE);

-- Policy: Users can manage their own lists
CREATE POLICY "Users can manage their own shared lists"
  ON shared_lists
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
