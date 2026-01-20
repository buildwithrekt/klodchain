-- Migration: Drop unused tables
-- These tables are no longer used in the codebase

-- ============================================
-- Old token system (replaced by created_tokens + Birdeye)
-- ============================================

-- Drop token_trades (never actually used, trades come from Birdeye API)
DROP TABLE IF EXISTS token_trades CASCADE;

-- Drop token_balances (was for KLOD token system, no longer used)
DROP TABLE IF EXISTS token_balances CASCADE;

-- Drop tokens table (was for KLOD token, no longer used)
DROP TABLE IF EXISTS tokens CASCADE;

-- ============================================
-- Old simulated memecoin system (replaced by real Pump.fun tokens)
-- ============================================

-- Drop memecoin_trades (old simulated trades)
DROP TABLE IF EXISTS memecoin_trades CASCADE;

-- Drop memecoin_holdings (old simulated holdings)
DROP TABLE IF EXISTS memecoin_holdings CASCADE;

-- Drop memecoins (old simulated memecoins)
DROP TABLE IF EXISTS memecoins CASCADE;

-- ============================================
-- Old ClaudeChain wallet system (no longer used)
-- ============================================

-- Drop wallet_transactions (old simulated wallet transactions)
DROP TABLE IF EXISTS wallet_transactions CASCADE;

-- Drop wallets (old simulated wallets with claude_xxx format)
DROP TABLE IF EXISTS wallets CASCADE;

-- ============================================
-- Old simulator tables
-- ============================================

-- Drop epochs table (old simulator table, never used)
DROP TABLE IF EXISTS epochs CASCADE;
