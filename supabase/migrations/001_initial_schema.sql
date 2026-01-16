-- Agents table (autonomous AI agents managing the blockchain)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- validator, architect, analyst, reviewer, consensus, oracle
  status TEXT DEFAULT 'active', -- active, idle, offline
  uptime DECIMAL DEFAULT 99.9,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validators table
CREATE TABLE validators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey TEXT UNIQUE NOT NULL,
  name TEXT,
  stake BIGINT DEFAULT 0,
  blocks_produced INTEGER DEFAULT 0,
  skip_rate DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks table
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot BIGINT UNIQUE NOT NULL,
  parent_slot BIGINT,
  blockhash TEXT NOT NULL,
  previous_blockhash TEXT,
  leader_pubkey TEXT NOT NULL REFERENCES validators(pubkey),
  transaction_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  poh_hash TEXT,
  FOREIGN KEY (parent_slot) REFERENCES blocks(slot)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT UNIQUE NOT NULL,
  slot BIGINT REFERENCES blocks(slot),
  block_index INTEGER,
  fee BIGINT DEFAULT 5000,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  transaction_type TEXT NOT NULL, -- transfer, create_account, program_call
  from_pubkey TEXT NOT NULL,
  to_pubkey TEXT,
  amount BIGINT,
  program_id TEXT,
  instruction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Accounts table
CREATE TABLE accounts (
  pubkey TEXT PRIMARY KEY,
  owner TEXT NOT NULL DEFAULT '11111111111111111111111111111111', -- System Program
  lamports BIGINT DEFAULT 0,
  data JSONB DEFAULT '{}',
  executable BOOLEAN DEFAULT false,
  rent_epoch BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Epochs table
CREATE TABLE epochs (
  epoch_number INTEGER PRIMARY KEY,
  start_slot BIGINT NOT NULL,
  end_slot BIGINT NOT NULL,
  leader_schedule JSONB NOT NULL, -- {slot: validator_pubkey}
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Network stats table (for historical metrics)
CREATE TABLE network_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot BIGINT NOT NULL,
  tps DECIMAL,
  active_validators INTEGER,
  total_transactions BIGINT,
  total_accounts INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_blocks_slot ON blocks(slot DESC);
CREATE INDEX idx_transactions_slot ON transactions(slot);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_from ON transactions(from_pubkey);
CREATE INDEX idx_accounts_owner ON accounts(owner);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE network_stats;

-- Seed initial agents
INSERT INTO agents (pubkey, name, role, status, uptime) VALUES
  ('K1odVa1idator111111111111111111111111111111', 'KLOD Validator', 'validator', 'active', 99.9),
  ('K1odArchitect222222222222222222222222222222', 'KLOD Architect', 'architect', 'active', 99.8),
  ('K1odAna1yst3333333333333333333333333333333', 'KLOD Analyst', 'analyst', 'active', 99.9),
  ('K1odReviewer44444444444444444444444444444', 'KLOD Reviewer', 'reviewer', 'active', 99.7),
  ('K1odConsensus5555555555555555555555555555', 'KLOD Consensus', 'consensus', 'active', 99.9),
  ('K1od0rac1e666666666666666666666666666666', 'KLOD Oracle', 'oracle', 'active', 99.8);

-- Seed initial validators (same as agents for now)
INSERT INTO validators (pubkey, name, stake, is_active) VALUES
  ('K1odVa1idator111111111111111111111111111111', 'KLOD Validator', 500000000000, true),
  ('K1odArchitect222222222222222222222222222222', 'KLOD Architect', 450000000000, true),
  ('K1odAna1yst3333333333333333333333333333333', 'KLOD Analyst', 400000000000, true),
  ('K1odReviewer44444444444444444444444444444', 'KLOD Reviewer', 350000000000, true),
  ('K1odConsensus5555555555555555555555555555', 'KLOD Consensus', 480000000000, true),
  ('K1od0rac1e666666666666666666666666666666', 'KLOD Oracle', 420000000000, true);

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

-- Transactions: Public read, anyone can insert (submit tx), only service can update
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
