-- Tokens table (for klodchain native token)
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER DEFAULT 9,
  total_supply BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token balances per wallet
CREATE TABLE IF NOT EXISTS token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  token_mint TEXT NOT NULL REFERENCES tokens(mint_address),
  balance BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, token_mint)
);

-- Insert the klodchain token
INSERT INTO tokens (mint_address, name, symbol, decimals, total_supply)
VALUES (
  '8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump',
  'klodchain',
  'KLOD',
  9,
  1000000000000000000 -- 1 billion KLOD with 9 decimals
) ON CONFLICT (mint_address) DO NOTHING;

-- Index for fast balance lookups
CREATE INDEX IF NOT EXISTS idx_token_balances_wallet ON token_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_balances_mint ON token_balances(token_mint);

-- Enable realtime for token_balances
ALTER PUBLICATION supabase_realtime ADD TABLE token_balances;

-- RLS policies
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;

-- Anyone can read tokens
CREATE POLICY "Tokens are publicly readable" ON tokens
  FOR SELECT USING (true);

-- Anyone can read token balances
CREATE POLICY "Token balances are publicly readable" ON token_balances
  FOR SELECT USING (true);

-- Service role can insert/update balances
CREATE POLICY "Service role can manage token balances" ON token_balances
  FOR ALL USING (true) WITH CHECK (true);
