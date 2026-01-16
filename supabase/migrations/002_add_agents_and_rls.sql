-- Migration: Add agents table and enable RLS
-- Run this if you already have the base tables

-- ============================================
-- AGENTS TABLE (only if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  uptime DECIMAL DEFAULT 99.9,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for agents
ALTER PUBLICATION supabase_realtime ADD TABLE agents;

-- Seed agents (only if table is empty)
INSERT INTO agents (pubkey, name, role, status, uptime)
SELECT * FROM (VALUES
  ('K1odVa1idator111111111111111111111111111111', 'KLOD Validator', 'validator', 'active', 99.9),
  ('K1odArchitect222222222222222222222222222222', 'KLOD Architect', 'architect', 'active', 99.8),
  ('K1odAna1yst3333333333333333333333333333333', 'KLOD Analyst', 'analyst', 'active', 99.9),
  ('K1odReviewer44444444444444444444444444444', 'KLOD Reviewer', 'reviewer', 'active', 99.7),
  ('K1odConsensus5555555555555555555555555555', 'KLOD Consensus', 'consensus', 'active', 99.9),
  ('K1od0rac1e666666666666666666666666666666', 'KLOD Oracle', 'oracle', 'active', 99.8)
) AS v(pubkey, name, role, status, uptime)
WHERE NOT EXISTS (SELECT 1 FROM agents LIMIT 1);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE validators ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "agents_public_read" ON agents;
DROP POLICY IF EXISTS "agents_service_write" ON agents;
DROP POLICY IF EXISTS "validators_public_read" ON validators;
DROP POLICY IF EXISTS "validators_service_write" ON validators;
DROP POLICY IF EXISTS "blocks_public_read" ON blocks;
DROP POLICY IF EXISTS "blocks_service_write" ON blocks;
DROP POLICY IF EXISTS "transactions_public_read" ON transactions;
DROP POLICY IF EXISTS "transactions_public_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_service_update" ON transactions;
DROP POLICY IF EXISTS "accounts_public_read" ON accounts;
DROP POLICY IF EXISTS "accounts_service_write" ON accounts;
DROP POLICY IF EXISTS "epochs_public_read" ON epochs;
DROP POLICY IF EXISTS "epochs_service_write" ON epochs;
DROP POLICY IF EXISTS "network_stats_public_read" ON network_stats;
DROP POLICY IF EXISTS "network_stats_service_write" ON network_stats;

-- Agents: Public read, only service role can write
CREATE POLICY "agents_public_read" ON agents
  FOR SELECT USING (true);

CREATE POLICY "agents_service_write" ON agents
  FOR ALL USING (auth.role() = 'service_role');

-- Validators: Public read, only service role can write
CREATE POLICY "validators_public_read" ON validators
  FOR SELECT USING (true);

CREATE POLICY "validators_service_write" ON validators
  FOR ALL USING (auth.role() = 'service_role');

-- Blocks: Public read, only service role can write
CREATE POLICY "blocks_public_read" ON blocks
  FOR SELECT USING (true);

CREATE POLICY "blocks_service_write" ON blocks
  FOR ALL USING (auth.role() = 'service_role');

-- Transactions: Public read, anyone can insert, only service can update
CREATE POLICY "transactions_public_read" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "transactions_public_insert" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "transactions_service_update" ON transactions
  FOR UPDATE USING (auth.role() = 'service_role');

-- Accounts: Public read, only service role can write
CREATE POLICY "accounts_public_read" ON accounts
  FOR SELECT USING (true);

CREATE POLICY "accounts_service_write" ON accounts
  FOR ALL USING (auth.role() = 'service_role');

-- Epochs: Public read, only service role can write
CREATE POLICY "epochs_public_read" ON epochs
  FOR SELECT USING (true);

CREATE POLICY "epochs_service_write" ON epochs
  FOR ALL USING (auth.role() = 'service_role');

-- Network stats: Public read, only service role can write
CREATE POLICY "network_stats_public_read" ON network_stats
  FOR SELECT USING (true);

CREATE POLICY "network_stats_service_write" ON network_stats
  FOR ALL USING (auth.role() = 'service_role');
