-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AVAILABILITY_CARDS TABLE
-- ============================================
CREATE TABLE availability_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imdb_id TEXT NOT NULL,
  tmdb_id TEXT,
  watchmode_id TEXT,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'series')),
  genres TEXT[] DEFAULT '{}',
  subgenres TEXT[] DEFAULT '{}',
  is_genre_highlight BOOLEAN DEFAULT FALSE,
  sources JSONB DEFAULT '[]',
  poster_url TEXT,
  backdrop_url TEXT,
  synopsis TEXT,
  runtime_minutes INTEGER,
  mpaa_rating TEXT,
  director TEXT,
  country TEXT,
  imdb_rating NUMERIC(3,1),
  rt_score INTEGER,
  letterboxd_rating NUMERIC(3,2),
  editorial_tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  availability_checked_at TIMESTAMPTZ
);

-- Indexes for availability_cards
CREATE INDEX idx_availability_cards_imdb_id ON availability_cards(imdb_id);
CREATE INDEX idx_availability_cards_genres ON availability_cards USING GIN(genres);
CREATE INDEX idx_availability_cards_is_genre_highlight ON availability_cards(is_genre_highlight) WHERE is_genre_highlight = TRUE;
CREATE INDEX idx_availability_cards_featured ON availability_cards(featured) WHERE featured = TRUE;

-- Enable RLS
ALTER TABLE availability_cards ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Allow public read access on availability_cards"
  ON availability_cards
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- 2. EPG_SCHEDULE TABLE
-- ============================================
CREATE TABLE epg_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  card_id UUID REFERENCES availability_cards(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  synopsis TEXT,
  is_genre_highlight BOOLEAN DEFAULT FALSE,
  source TEXT NOT NULL CHECK (source IN ('api', 'spreadsheet', 'manual')),
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for epg_schedule
CREATE INDEX idx_epg_schedule_channel_id ON epg_schedule(channel_id);
CREATE INDEX idx_epg_schedule_start_time ON epg_schedule(start_time);
CREATE INDEX idx_epg_schedule_time_range ON epg_schedule(start_time, end_time);

-- Enable RLS
ALTER TABLE epg_schedule ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Allow public read access on epg_schedule"
  ON epg_schedule
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- 3. CURATED_LISTS TABLE
-- ============================================
CREATE TABLE curated_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  cards UUID[] DEFAULT '{}',
  type TEXT NOT NULL CHECK (type IN ('editorial', 'user-watchlist', 'user-custom')),
  author TEXT,
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for curated_lists
CREATE UNIQUE INDEX idx_curated_lists_slug ON curated_lists(slug);
CREATE INDEX idx_curated_lists_featured ON curated_lists(featured) WHERE featured = TRUE;
CREATE INDEX idx_curated_lists_published ON curated_lists(published) WHERE published = TRUE;

-- Enable RLS
ALTER TABLE curated_lists ENABLE ROW LEVEL SECURITY;

-- Public read access for published lists
CREATE POLICY "Allow public read access on published curated_lists"
  ON curated_lists
  FOR SELECT
  TO anon, authenticated
  USING (published = TRUE OR type = 'editorial');

-- ============================================
-- 4. USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  substack_tier TEXT DEFAULT 'free',
  connected_services TEXT[] DEFAULT '{}',
  watchlist UUID[] DEFAULT '{}',
  favorites UUID[] DEFAULT '{}',
  watched UUID[] DEFAULT '{}',
  custom_lists UUID[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  email_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- 5. USER_LIST_ITEMS JUNCTION TABLE
-- ============================================
CREATE TABLE user_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES availability_cards(id) ON DELETE CASCADE,
  list_type TEXT NOT NULL CHECK (list_type IN ('watchlist', 'favorite', 'watched')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id, list_type)
);

-- Indexes for user_list_items
CREATE INDEX idx_user_list_items_user_id ON user_list_items(user_id);
CREATE INDEX idx_user_list_items_card_id ON user_list_items(card_id);
CREATE INDEX idx_user_list_items_list_type ON user_list_items(list_type);

-- Enable RLS
ALTER TABLE user_list_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own list items
CREATE POLICY "Users can read own list items"
  ON user_list_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own list items"
  ON user_list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own list items"
  ON user_list_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_availability_cards_updated_at
  BEFORE UPDATE ON availability_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curated_lists_updated_at
  BEFORE UPDATE ON curated_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
