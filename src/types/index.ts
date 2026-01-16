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
  transaction_type: "transfer" | "create_account" | "program_call";
  from_pubkey: string;
  to_pubkey: string | null;
  amount: number | null;
  program_id: string | null;
  instruction_data: Record<string, unknown> | null;
  created_at: string;
  confirmed_at: string | null;
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
