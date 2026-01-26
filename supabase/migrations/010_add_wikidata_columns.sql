-- Add Wikidata tracking columns to availability_cards
-- These help track the source of the data and detect updates

ALTER TABLE availability_cards
ADD COLUMN IF NOT EXISTS wikidata_id TEXT,
ADD COLUMN IF NOT EXISTS wikidata_modified TIMESTAMPTZ;

-- Index for Wikidata ID lookups
CREATE INDEX IF NOT EXISTS idx_availability_cards_wikidata_id
ON availability_cards(wikidata_id)
WHERE wikidata_id IS NOT NULL;

-- Add unique constraint on imdb_id if not exists
-- This prevents duplicate entries for the same movie
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'availability_cards_imdb_id_unique'
  ) THEN
    ALTER TABLE availability_cards
    ADD CONSTRAINT availability_cards_imdb_id_unique UNIQUE (imdb_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
