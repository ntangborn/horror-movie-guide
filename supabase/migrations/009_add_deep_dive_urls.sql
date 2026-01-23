-- Add deep_dive_urls column for manual URL management
-- URLs will be stored as JSONB array with format:
-- [{ "url": "https://...", "label": "Article Title", "source": "Site Name", "added_at": "ISO timestamp" }]

ALTER TABLE availability_cards
ADD COLUMN IF NOT EXISTS deep_dive_urls JSONB DEFAULT '[]';

-- Add index for queries that filter by non-empty deep_dive_urls
CREATE INDEX IF NOT EXISTS idx_availability_cards_deep_dive_urls
ON availability_cards USING GIN (deep_dive_urls)
WHERE deep_dive_urls != '[]'::jsonb;
