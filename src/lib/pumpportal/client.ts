import {
  PumpfunTokenInfo,
  CreateTokenMetadata,
  CreateTokenParams,
  TradeParams,
  IPFSUploadResponse,
} from "./types";

const PUMPPORTAL_API = "https://pumpportal.fun/api";
const PUMPFUN_API = "https://frontend-api.pump.fun";

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

    const response = await fetch(`${PUMPPORTAL_API}/ipfs`, {
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

    return response.text(); // Base64 encoded transaction
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

    return response.text();
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

    return response.text();
  }

  /**
   * Fetch token info from Pump.fun API
   */
  async getTokenInfo(mint: string): Promise<PumpfunTokenInfo> {
    const response = await fetch(`${PUMPFUN_API}/coins/${mint}`);

    if (!response.ok) {
      throw new Error("Token not found on Pump.fun");
    }

    return response.json();
  }

  /**
   * Fetch multiple tokens (for refreshing stats)
   */
  async getTokensInfo(mints: string[]): Promise<PumpfunTokenInfo[]> {
    const results = await Promise.allSettled(
      mints.map((mint) => this.getTokenInfo(mint))
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<PumpfunTokenInfo> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value);
  }
}

// Singleton instance
export const pumpPortal = new PumpPortalClient();
