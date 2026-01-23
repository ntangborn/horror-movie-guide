-- Add UPDATE policy for user_list_items
-- This was missing, causing reorder (PATCH) operations to fail with RLS enabled

CREATE POLICY "Users can update own list items"
  ON user_list_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
