-- Vanity keypairs reserve for token creation
-- Pre-generated keypairs with addresses ending in "klod"

CREATE TABLE IF NOT EXISTS vanity_keypairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key TEXT UNIQUE NOT NULL,
  secret_key TEXT NOT NULL, -- Base64 encoded, should be encrypted in production
  suffix TEXT NOT NULL DEFAULT 'klod',
  is_used BOOLEAN DEFAULT FALSE,
  used_by_token TEXT REFERENCES created_tokens(mint_address),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup of available keypairs
CREATE INDEX idx_vanity_keypairs_available ON vanity_keypairs(suffix, is_used) WHERE is_used = FALSE;
CREATE INDEX idx_vanity_keypairs_public_key ON vanity_keypairs(public_key);

-- Function to get and reserve next available keypair
CREATE OR REPLACE FUNCTION get_next_vanity_keypair(target_suffix TEXT DEFAULT 'klod')
RETURNS TABLE(public_key TEXT, secret_key TEXT) AS $$
DECLARE
  keypair_id UUID;
  kp_public_key TEXT;
  kp_secret_key TEXT;
BEGIN
  -- Lock and get the next available keypair
  SELECT vk.id, vk.public_key, vk.secret_key
  INTO keypair_id, kp_public_key, kp_secret_key
  FROM vanity_keypairs vk
  WHERE vk.suffix = target_suffix AND vk.is_used = FALSE
  ORDER BY vk.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF keypair_id IS NULL THEN
    RETURN;
  END IF;

  -- Mark as used
  UPDATE vanity_keypairs SET is_used = TRUE, used_at = NOW()
  WHERE id = keypair_id;

  RETURN QUERY SELECT kp_public_key, kp_secret_key;
END;
$$ LANGUAGE plpgsql;
