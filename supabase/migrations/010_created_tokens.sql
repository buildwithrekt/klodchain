-- Migration: Real tokens created via Klodchain (launched on Pump.fun)
-- This replaces the simulated memecoin system with real Pump.fun tokens

-- Real tokens created via Klodchain
CREATE TABLE IF NOT EXISTS created_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pump.fun identifiers
  mint_address TEXT UNIQUE NOT NULL,
  bonding_curve TEXT,
  associated_bonding_curve TEXT,

  -- Metadata
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Social links
  twitter_url TEXT,
  telegram_url TEXT,
  website_url TEXT,

  -- Creator
  creator_wallet TEXT NOT NULL,

  -- Stats (refreshed from Pump.fun API)
  price_sol DECIMAL,
  market_cap_sol DECIMAL,
  market_cap_usd DECIMAL,
  virtual_sol_reserves DECIMAL,
  virtual_token_reserves DECIMAL,
  total_supply DECIMAL,

  -- Status
  is_graduated BOOLEAN DEFAULT false,
  raydium_pool TEXT,

  -- TX
  creation_signature TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade history (for analytics)
CREATE TABLE IF NOT EXISTS token_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_mint TEXT REFERENCES created_tokens(mint_address) ON DELETE CASCADE,
  trader_wallet TEXT NOT NULL,
  trade_type TEXT CHECK (trade_type IN ('buy', 'sell')),
  sol_amount DECIMAL NOT NULL,
  token_amount DECIMAL NOT NULL,
  price_per_token DECIMAL,
  tx_signature TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_created_tokens_creator ON created_tokens(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_created_tokens_market_cap ON created_tokens(market_cap_sol DESC);
CREATE INDEX IF NOT EXISTS idx_created_tokens_created ON created_tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_trades_token ON token_trades(token_mint);
CREATE INDEX IF NOT EXISTS idx_token_trades_trader ON token_trades(trader_wallet);

-- RLS Policies
ALTER TABLE created_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_trades ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to created_tokens"
  ON created_tokens FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to token_trades"
  ON token_trades FOR SELECT
  USING (true);

-- Allow insert for authenticated and anon users (via API)
CREATE POLICY "Allow insert to created_tokens"
  ON created_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow insert to token_trades"
  ON token_trades FOR INSERT
  WITH CHECK (true);

-- Allow update for stats refresh
CREATE POLICY "Allow update to created_tokens"
  ON created_tokens FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE created_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE token_trades;
