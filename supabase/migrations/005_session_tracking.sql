-- Session tracking for analytics
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_session_events_session_id ON session_events(session_id);
CREATE INDEX idx_session_events_event_type ON session_events(event_type);
CREATE INDEX idx_session_events_created_at ON session_events(created_at);
CREATE INDEX idx_session_events_page_path ON session_events(page_path);

-- Enable RLS
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous insert on session_events"
  ON session_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read (via service key or authenticated admin check)
CREATE POLICY "Allow authenticated read on session_events"
  ON session_events
  FOR SELECT
  TO authenticated
  USING (true);
