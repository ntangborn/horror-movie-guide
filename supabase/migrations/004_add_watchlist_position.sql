-- Add position column for drag-and-drop ordering in watchlist
ALTER TABLE user_list_items
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Update existing items to have sequential positions (ordered by id)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id) - 1 as new_position
  FROM user_list_items
)
UPDATE user_list_items
SET position = numbered.new_position
FROM numbered
WHERE user_list_items.id = numbered.id;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_user_list_items_position ON user_list_items(user_id, position);
