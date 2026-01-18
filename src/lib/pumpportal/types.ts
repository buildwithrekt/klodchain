// PumpPortal API Types

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
