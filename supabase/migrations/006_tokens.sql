-- Migration: Memecoin System
-- Creates tables for memecoin creation, holdings, and trades

-- Memecoins table (user-created tokens)
CREATE TABLE IF NOT EXISTS memecoins (
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

-- Memecoin holdings (who owns how much)
CREATE TABLE IF NOT EXISTS memecoin_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memecoin_address TEXT NOT NULL REFERENCES memecoins(address) ON DELETE CASCADE,
  wallet_pubkey TEXT NOT NULL,
  amount BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(memecoin_address, wallet_pubkey)
);

-- Memecoin trades history
CREATE TABLE IF NOT EXISTS memecoin_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memecoin_address TEXT NOT NULL REFERENCES memecoins(address) ON DELETE CASCADE,
  trader_pubkey TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  klod_amount BIGINT NOT NULL,
  token_amount BIGINT NOT NULL,
  price_per_token DECIMAL(20, 10) NOT NULL,
  signature TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memecoins_creator ON memecoins(creator_pubkey);
CREATE INDEX IF NOT EXISTS idx_memecoins_market_cap ON memecoins(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_memecoins_created_at ON memecoins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memecoin_holdings_wallet ON memecoin_holdings(wallet_pubkey);
CREATE INDEX IF NOT EXISTS idx_memecoin_holdings_token ON memecoin_holdings(memecoin_address);
CREATE INDEX IF NOT EXISTS idx_memecoin_trades_token ON memecoin_trades(memecoin_address);
CREATE INDEX IF NOT EXISTS idx_memecoin_trades_trader ON memecoin_trades(trader_pubkey);
CREATE INDEX IF NOT EXISTS idx_memecoin_trades_created ON memecoin_trades(created_at DESC);

-- Enable RLS
ALTER TABLE memecoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE memecoin_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memecoin_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Memecoins are viewable by everyone" ON memecoins;
DROP POLICY IF EXISTS "Memecoins can be inserted" ON memecoins;
DROP POLICY IF EXISTS "Memecoins can be updated" ON memecoins;
CREATE POLICY "Memecoins are viewable by everyone" ON memecoins FOR SELECT USING (true);
CREATE POLICY "Memecoins can be inserted" ON memecoins FOR INSERT WITH CHECK (true);
CREATE POLICY "Memecoins can be updated" ON memecoins FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Holdings are viewable by everyone" ON memecoin_holdings;
DROP POLICY IF EXISTS "Holdings can be inserted" ON memecoin_holdings;
DROP POLICY IF EXISTS "Holdings can be updated" ON memecoin_holdings;
DROP POLICY IF EXISTS "Holdings can be deleted" ON memecoin_holdings;
CREATE POLICY "Holdings are viewable by everyone" ON memecoin_holdings FOR SELECT USING (true);
CREATE POLICY "Holdings can be inserted" ON memecoin_holdings FOR INSERT WITH CHECK (true);
CREATE POLICY "Holdings can be updated" ON memecoin_holdings FOR UPDATE USING (true);
CREATE POLICY "Holdings can be deleted" ON memecoin_holdings FOR DELETE USING (true);

DROP POLICY IF EXISTS "Trades are viewable by everyone" ON memecoin_trades;
DROP POLICY IF EXISTS "Trades can be inserted" ON memecoin_trades;
CREATE POLICY "Trades are viewable by everyone" ON memecoin_trades FOR SELECT USING (true);
CREATE POLICY "Trades can be inserted" ON memecoin_trades FOR INSERT WITH CHECK (true);

-- Enable realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE memecoins;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE memecoin_trades;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
