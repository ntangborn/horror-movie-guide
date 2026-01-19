-- Add position column to user_list_items for drag-and-drop reordering
ALTER TABLE user_list_items ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_user_list_items_position ON user_list_items(user_id, list_type, position);

-- Update existing items to have sequential positions based on added_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, list_type ORDER BY added_at) - 1 AS new_position
  FROM user_list_items
)
UPDATE user_list_items
SET position = ranked.new_position
FROM ranked
WHERE user_list_items.id = ranked.id;
