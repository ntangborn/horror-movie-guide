-- ============================================
-- CLICK_EVENTS TABLE
-- Tracks click-outs to streaming services
-- ============================================

CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  card_id UUID NOT NULL REFERENCES availability_cards(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('subscription', 'free', 'rent', 'buy')),
  deep_link TEXT,
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_click_events_created_at ON click_events(created_at);
CREATE INDEX idx_click_events_service ON click_events(service);
CREATE INDEX idx_click_events_card_id ON click_events(card_id);
CREATE INDEX idx_click_events_user_id ON click_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_click_events_session_id ON click_events(session_id) WHERE session_id IS NOT NULL;

-- Composite index for time-based service analytics
CREATE INDEX idx_click_events_service_time ON click_events(service, created_at);

-- Enable RLS
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking non-logged-in users)
CREATE POLICY "Allow anonymous insert on click_events"
  ON click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can read their own click events
CREATE POLICY "Users can read own click events"
  ON click_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin read access (for analytics) - requires service role or custom admin check
-- For now, allow authenticated users to read aggregated data
CREATE POLICY "Allow authenticated read for analytics"
  ON click_events
  FOR SELECT
  TO authenticated
  USING (true);
