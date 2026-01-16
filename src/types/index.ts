export interface Validator {
  id: string;
  pubkey: string;
  name: string | null;
  stake: number;
  blocks_produced: number;
  skip_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Block {
  id: string;
  slot: number;
  parent_slot: number | null;
  blockhash: string;
  previous_blockhash: string | null;
  leader_pubkey: string;
  transaction_count: number;
  timestamp: string;
  poh_hash: string | null;
}

export interface Transaction {
  id: string;
  signature: string;
  slot: number | null;
  block_index: number | null;
  fee: number;
  status: "pending" | "confirmed" | "failed";
  transaction_type: "transfer" | "token_transfer" | "create_account" | "program_call" | "stake" | "vote" | "faucet_claim" | "token_create" | "token_buy" | "token_sell";
  from_pubkey: string;
  to_pubkey: string | null;
  amount: number | null;
  program_id: string | null;
  instruction_data: Record<string, unknown> | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  telegram_url: string | null;
  creator_pubkey: string;
  total_supply: number;
  circulating_supply: number;
  price: number;
  market_cap: number;
  volume_24h: number;
  created_at: string;
}

export interface TokenHolding {
  id: string;
  token_address: string;
  wallet_pubkey: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface TokenTrade {
  id: string;
  token_address: string;
  trader_pubkey: string;
  trade_type: "buy" | "sell";
  klod_amount: number;
  token_amount: number;
  price_per_token: number;
  signature: string;
  created_at: string;
}

export interface Account {
  pubkey: string;
  owner: string;
  lamports: number;
  data: Record<string, unknown>;
  executable: boolean;
  rent_epoch: number;
  created_at: string;
  updated_at: string;
}

export interface Epoch {
  epoch_number: number;
  start_slot: number;
  end_slot: number;
  leader_schedule: Record<number, string>;
  started_at: string;
  completed_at: string | null;
}

export interface NetworkStats {
  id: string;
  slot: number;
  tps: number;
  active_validators: number;
  total_transactions: number;
  total_accounts: number;
  recorded_at: string;
}

export interface SimulationState {
  isRunning: boolean;
  currentSlot: number;
  currentEpoch: number;
  speed: number;
  tps: number;
}

// Re-export custom agent types
export * from "./custom-agent";
