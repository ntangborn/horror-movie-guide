-- Migration: Add trailer support to availability_cards
-- Adds columns for YouTube trailer data with review/approval workflow

ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_youtube_id TEXT;
ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_video_title TEXT;
ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_channel TEXT;
ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_embed_code TEXT;
ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_status TEXT DEFAULT 'none';
  -- Values: 'none', 'pending', 'approved', 'rejected'
ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_reviewed_at TIMESTAMPTZ;
ALTER TABLE availability_cards ADD COLUMN IF NOT EXISTS trailer_scraped_at TIMESTAMPTZ;

-- Index for efficient filtering by trailer status in admin UI
CREATE INDEX IF NOT EXISTS idx_availability_cards_trailer_status
  ON availability_cards(trailer_status);

-- Composite index for finding titles needing trailers (recent + no trailer)
CREATE INDEX IF NOT EXISTS idx_availability_cards_trailer_export
  ON availability_cards(availability_checked_at, trailer_status)
  WHERE trailer_status = 'none';

COMMENT ON COLUMN availability_cards.trailer_youtube_id IS 'YouTube video ID for embedded trailer';
COMMENT ON COLUMN availability_cards.trailer_video_title IS 'Title of the YouTube trailer video';
COMMENT ON COLUMN availability_cards.trailer_channel IS 'YouTube channel that uploaded the trailer';
COMMENT ON COLUMN availability_cards.trailer_embed_code IS 'Full iframe embed code for the trailer';
COMMENT ON COLUMN availability_cards.trailer_status IS 'Review status: none, pending, approved, rejected';
COMMENT ON COLUMN availability_cards.trailer_reviewed_at IS 'Timestamp when trailer was approved/rejected';
COMMENT ON COLUMN availability_cards.trailer_scraped_at IS 'Timestamp when trailer was found via scraper';
