-- Migration: Virtual USDK Pool (pump.fun style)
-- Converts the AMM to a virtual bonding curve with USDK as quote currency

-- Rename reserve columns to virtual USDK pool
ALTER TABLE memecoins
RENAME COLUMN reserve_klod TO virtual_usdk_reserve;

-- Add new columns for pump.fun style mechanics
ALTER TABLE memecoins
ADD COLUMN IF NOT EXISTS virtual_token_reserve BIGINT DEFAULT 1000000000000000,
ADD COLUMN IF NOT EXISTS is_graduated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS graduation_threshold DECIMAL(20, 6) DEFAULT 69000, -- $69K market cap
ADD COLUMN IF NOT EXISTS total_usdk_raised DECIMAL(20, 6) DEFAULT 0;

-- Copy existing reserve_token to virtual_token_reserve and drop old column
UPDATE memecoins SET virtual_token_reserve = reserve_token WHERE reserve_token IS NOT NULL;
ALTER TABLE memecoins DROP COLUMN IF EXISTS reserve_token;

-- Rename in trades table
ALTER TABLE memecoin_trades
RENAME COLUMN klod_amount TO usdk_amount;

-- Update initial virtual reserves for pump.fun style curve
-- Virtual pool starts with: 4000 USDK + 1B tokens (with 6 decimals)
-- This gives initial price of 4000/1B = 0.000004 USDK per token
-- Initial market cap = 1B tokens * 0.000004 = $4,000
-- Graduation at $69K market cap (like pump.fun)

-- Reset existing tokens to new initial values
UPDATE memecoins SET
  virtual_usdk_reserve = 4000,
  virtual_token_reserve = 1000000000000000
WHERE virtual_usdk_reserve IS NOT NULL;

COMMENT ON COLUMN memecoins.virtual_usdk_reserve IS 'Virtual USDK in bonding curve pool - starts at 4000 USDK';
COMMENT ON COLUMN memecoins.virtual_token_reserve IS 'Virtual tokens in bonding curve pool - starts at 1B (with 6 decimals)';
COMMENT ON COLUMN memecoins.is_graduated IS 'True when market cap reaches graduation_threshold and liquidity is migrated';
COMMENT ON COLUMN memecoins.total_usdk_raised IS 'Total USDK raised through bonding curve sales';
