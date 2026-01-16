-- Migration: Token/Memecoin System
-- Creates tables for token creation, holdings, and trades

-- Tokens table (memecoins)
CREATE TABLE IF NOT EXISTS tokens (
  address TEXT PRIMARY KEY,  -- ends with "klod"
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  telegram_url TEXT,
  creator_pubkey TEXT NOT NULL,
  total_supply BIGINT DEFAULT 1000000000000000,  -- 1B with 6 decimals
  circulating_supply BIGINT DEFAULT 0,
  price DECIMAL(20, 10) DEFAULT 0.000001,
  market_cap DECIMAL(20, 6) DEFAULT 0,
  volume_24h DECIMAL(20, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token holdings (who owns how much)
CREATE TABLE IF NOT EXISTS token_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
  wallet_pubkey TEXT NOT NULL,
  amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_address, wallet_pubkey)
);

-- Token trades history
CREATE TABLE IF NOT EXISTS token_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL REFERENCES tokens(address) ON DELETE CASCADE,
  trader_pubkey TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  klod_amount BIGINT NOT NULL,
  token_amount BIGINT NOT NULL,
  price_per_token DECIMAL(20, 10) NOT NULL,
  signature TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_creator ON tokens(creator_pubkey);
CREATE INDEX IF NOT EXISTS idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_holdings_wallet ON token_holdings(wallet_pubkey);
CREATE INDEX IF NOT EXISTS idx_token_holdings_token ON token_holdings(token_address);
CREATE INDEX IF NOT EXISTS idx_token_trades_token ON token_trades(token_address);
CREATE INDEX IF NOT EXISTS idx_token_trades_trader ON token_trades(trader_pubkey);
CREATE INDEX IF NOT EXISTS idx_token_trades_created ON token_trades(created_at DESC);

-- Enable RLS (safe to run multiple times)
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Tokens are viewable by everyone" ON tokens;
DROP POLICY IF EXISTS "Tokens can be inserted" ON tokens;
DROP POLICY IF EXISTS "Tokens can be updated" ON tokens;
CREATE POLICY "Tokens are viewable by everyone" ON tokens FOR SELECT USING (true);
CREATE POLICY "Tokens can be inserted" ON tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Tokens can be updated" ON tokens FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Holdings are viewable by everyone" ON token_holdings;
DROP POLICY IF EXISTS "Holdings can be inserted" ON token_holdings;
DROP POLICY IF EXISTS "Holdings can be updated" ON token_holdings;
DROP POLICY IF EXISTS "Holdings can be deleted" ON token_holdings;
CREATE POLICY "Holdings are viewable by everyone" ON token_holdings FOR SELECT USING (true);
CREATE POLICY "Holdings can be inserted" ON token_holdings FOR INSERT WITH CHECK (true);
CREATE POLICY "Holdings can be updated" ON token_holdings FOR UPDATE USING (true);
CREATE POLICY "Holdings can be deleted" ON token_holdings FOR DELETE USING (true);

DROP POLICY IF EXISTS "Trades are viewable by everyone" ON token_trades;
DROP POLICY IF EXISTS "Trades can be inserted" ON token_trades;
CREATE POLICY "Trades are viewable by everyone" ON token_trades FOR SELECT USING (true);
CREATE POLICY "Trades can be inserted" ON token_trades FOR INSERT WITH CHECK (true);

-- Enable realtime (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tokens;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE token_trades;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
