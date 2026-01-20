import {
  CreateTokenMetadata,
  CreateTokenParams,
  TradeParams,
  IPFSUploadResponse,
} from "./types";

const PUMPPORTAL_API = "https://pumpportal.fun/api";
const PUMPFUN_IPFS_API = "https://pump.fun/api";
const PUMPFUN_API = "https://frontend-api.pump.fun";

export interface PumpFunTokenInfo {
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
}

export class PumpPortalClient {
  /**
   * Upload token metadata (image + info) to IPFS via PumpPortal
   */
  async uploadMetadata(data: CreateTokenMetadata): Promise<string> {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("name", data.name);
    formData.append("symbol", data.symbol);
    formData.append("description", data.description);
    if (data.twitter) formData.append("twitter", data.twitter);
    if (data.telegram) formData.append("telegram", data.telegram);
    if (data.website) formData.append("website", data.website);
    formData.append("showName", "true");

    const response = await fetch(`${PUMPFUN_IPFS_API}/ipfs`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS upload failed: ${error}`);
    }

    const result: IPFSUploadResponse = await response.json();
    return result.metadataUri;
  }

  /**
   * Get unsigned transaction to create a new token
   * Returns base64 encoded transaction that needs to be signed
   */
  async getCreateTransaction(params: CreateTokenParams): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: params.creatorPubkey,
        action: "create",
        tokenMetadata: {
          name: params.name,
          symbol: params.symbol,
          uri: params.metadataUri,
        },
        mint: params.mintPubkey,
        denominatedInSol: "true",
        amount: params.initialBuySOL || 0,
        slippage: 10,
        priorityFee: 0.0005,
        pool: "pump",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Create token failed: ${error}`);
    }

    // Response is ArrayBuffer, convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return base64;
  }

  /**
   * Get unsigned transaction to buy tokens
   */
  async getBuyTransaction(params: TradeParams): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: params.publicKey,
        action: "buy",
        mint: params.mint,
        amount: params.amount,
        denominatedInSol: params.denominatedInSol ? "true" : "false",
        slippage: (params.slippageBps || 500) / 100,
        priorityFee: params.priorityFee || 0.0005,
        pool: "pump",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Buy transaction failed: ${error}`);
    }

    // Response is ArrayBuffer, convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return base64;
  }

  /**
   * Get unsigned transaction to sell tokens
   */
  async getSellTransaction(params: TradeParams): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: params.publicKey,
        action: "sell",
        mint: params.mint,
        amount: params.amount,
        denominatedInSol: params.denominatedInSol ? "true" : "false",
        slippage: (params.slippageBps || 500) / 100,
        priorityFee: params.priorityFee || 0.0005,
        pool: "pump",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sell transaction failed: ${error}`);
    }

    // Response is ArrayBuffer, convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return base64;
  }

  /**
   * Get token info from pump.fun
   */
  async getTokenInfo(mint: string): Promise<PumpFunTokenInfo> {
    const response = await fetch(`${PUMPFUN_API}/coins/${mint}`, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch token info: ${response.status}`);
    }

    return response.json();
  }

}

// Singleton instance
export const pumpPortal = new PumpPortalClient();
