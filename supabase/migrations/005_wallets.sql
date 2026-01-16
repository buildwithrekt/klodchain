-- Wallets table for ClaudeChain internal wallet system
CREATE TABLE IF NOT EXISTS wallets (
  pubkey TEXT PRIMARY KEY, -- Format: claude_xxx
  private_key TEXT NOT NULL, -- Hex string of private key
  balance BIGINT DEFAULT 0, -- CLAUDE balance (no decimals for simplicity)
  last_faucet_claim TIMESTAMPTZ, -- For 24h faucet limit
  transaction_count INTEGER DEFAULT 0,
  total_received BIGINT DEFAULT 0,
  total_sent BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_pubkey TEXT REFERENCES wallets(pubkey),
  to_pubkey TEXT REFERENCES wallets(pubkey),
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'transfer', 'faucet_claim'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_from ON wallet_transactions(from_pubkey);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_to ON wallet_transactions(to_pubkey);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;

-- RLS policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read wallets (for leaderboard, lookups)
CREATE POLICY "wallets_public_read" ON wallets
  FOR SELECT USING (true);

-- Anyone can insert wallets (create wallet)
CREATE POLICY "wallets_public_insert" ON wallets
  FOR INSERT WITH CHECK (true);

-- Anyone can update their own wallet (balance updates via service role, but allow anon for faucet)
CREATE POLICY "wallets_public_update" ON wallets
  FOR UPDATE USING (true);

-- Anyone can read transactions
CREATE POLICY "wallet_transactions_public_read" ON wallet_transactions
  FOR SELECT USING (true);

-- Anyone can insert transactions
CREATE POLICY "wallet_transactions_public_insert" ON wallet_transactions
  FOR INSERT WITH CHECK (true);
