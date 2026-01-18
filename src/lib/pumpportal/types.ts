// PumpPortal API Types

export interface PumpfunTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
  bonding_curve: string;
  associated_bonding_curve: string;
  creator: string;
  created_timestamp: number;
  raydium_pool: string | null;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  market_cap: number;
  usd_market_cap: number;
  king_of_the_hill_timestamp: number | null;
  reply_count: number;
  last_reply: number | null;
}

export interface CreateTokenMetadata {
  name: string;
  symbol: string;
  description: string;
  file: File;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface CreateTokenParams {
  creatorPubkey: string;
  name: string;
  symbol: string;
  metadataUri: string;
  mintPubkey: string;
  initialBuySOL?: number;
}

export interface TradeParams {
  publicKey: string;
  mint: string;
  amount: number;
  denominatedInSol: boolean;
  slippageBps?: number;
  priorityFee?: number;
}

export interface IPFSUploadResponse {
  metadataUri: string;
}
