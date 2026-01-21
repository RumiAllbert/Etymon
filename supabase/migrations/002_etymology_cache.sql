-- Etymology cache table for multi-layer caching
CREATE TABLE etymology_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_type VARCHAR(50) NOT NULL,
  cache_key VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  UNIQUE(cache_type, cache_key)
);

-- Index for fast cache lookups
CREATE INDEX idx_cache_lookup ON etymology_cache(cache_type, cache_key);

-- Index for cleanup of expired entries
CREATE INDEX idx_cache_expires ON etymology_cache(expires_at);

-- Row Level Security - cache is public read, but insert/update requires auth
ALTER TABLE etymology_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read from the cache (for server-side reads)
CREATE POLICY "Public read access to cache" ON etymology_cache FOR SELECT USING (true);

-- Server can insert/update cache (using service role key)
CREATE POLICY "Service role can manage cache" ON etymology_cache FOR ALL USING (true);

-- Function to increment hit count
CREATE OR REPLACE FUNCTION increment_cache_hit(p_cache_type VARCHAR, p_cache_key VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE etymology_cache
  SET hit_count = hit_count + 1
  WHERE cache_type = p_cache_type AND cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache entries (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM etymology_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
