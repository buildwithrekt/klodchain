-- Add liquidity pool columns to memecoins
ALTER TABLE memecoins
ADD COLUMN IF NOT EXISTS reserve_klod DECIMAL(20, 6) DEFAULT 4000,
ADD COLUMN IF NOT EXISTS reserve_token BIGINT DEFAULT 800000000000000;

-- Initial pool: 4000 KLOD + 800M tokens (with 6 decimals = 800000000000000)
-- This gives initial price of 4000/800M = 0.000005 KLOD per token
-- k = 4000 * 800000000 = 3.2 trillion (constant product)

-- Update existing memecoins with pool reserves
UPDATE memecoins
SET
  reserve_klod = 4000,
  reserve_token = 800000000000000 - circulating_supply
WHERE reserve_klod IS NULL OR reserve_token IS NULL;

-- Recalculate prices based on AMM formula
UPDATE memecoins
SET price = reserve_klod / (reserve_token / 1000000.0)
WHERE reserve_token > 0;
