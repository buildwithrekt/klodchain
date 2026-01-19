-- CRITICAL: Secure vanity_keypairs table
-- This table contains secret keys and must NOT be accessible via anon key

-- Enable RLS
ALTER TABLE vanity_keypairs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "vanity_keypairs_service_only" ON vanity_keypairs;

-- Only service role can access this table (NO public access)
CREATE POLICY "vanity_keypairs_service_only" ON vanity_keypairs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Revoke all access from anon and authenticated roles
REVOKE ALL ON vanity_keypairs FROM anon;
REVOKE ALL ON vanity_keypairs FROM authenticated;

-- Only service role can execute the function
REVOKE EXECUTE ON FUNCTION get_next_vanity_keypair FROM anon;
REVOKE EXECUTE ON FUNCTION get_next_vanity_keypair FROM authenticated;
