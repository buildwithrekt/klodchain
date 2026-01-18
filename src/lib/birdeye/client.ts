/**
 * Birdeye API Client for Solana token data
 * Docs: https://docs.birdeye.so/reference
 */

const BIRDEYE_API = "https://public-api.birdeye.so";
const API_KEY = process.env.BIRDEYE_API_KEY || "";

export interface BirdeyeTrade {
  txHash: string;
  blockUnixTime: number;
  source: string;
  owner: string;
  from: {
    symbol: string;
    decimals: number;
    address: string;
    amount: number;
    uiAmount: number;
    price: number;
    nearestPrice: number;
  };
  to: {
    symbol: string;
    decimals: number;
    address: string;
    amount: number;
    uiAmount: number;
    price: number;
    nearestPrice: number;
  };
  side: "buy" | "sell";
  volumeUSD: number;
}

export interface BirdeyeOHLCV {
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
  unixTime: number;
  address?: string;
  type?: string;
}

export type OHLCVInterval =
  | "1m" | "3m" | "5m" | "15m" | "30m"
  | "1H" | "2H" | "4H" | "6H" | "8H" | "12H"
  | "1D" | "3D" | "1W" | "1M";

export interface BirdeyeTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  liquidity: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  volume24hChange: number;
  marketCap: number;
  supply: number;
  holder: number;
  extensions?: {
    twitter?: string;
    telegram?: string;
    website?: string;
    description?: string;
  };
}

export interface BirdeyeMemeToken {
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  price: number;
  priceChange24hPercent: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holder: number;
  supply: number;
  platform: string; // pump_dot_fun, moonshot, etc.
  createdAt: number;
  popularityScore: number;
}

interface BirdeyeResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class BirdeyeClient {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      "Accept": "application/json",
      "X-API-KEY": API_KEY,
      "x-chain": "solana",
    };
  }

  /**
   * Get single meme token details
   * Endpoint: GET /defi/v3/token/meme/single
   */
  async getMemeTokenDetail(address: string): Promise<BirdeyeMemeToken | null> {
    try {
      const response = await fetch(
        `${BIRDEYE_API}/defi/v3/token/meme/single?address=${address}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error(`Birdeye API error: ${response.status}`);
        return null;
      }

      const result: BirdeyeResponse<BirdeyeMemeToken> = await response.json();

      if (!result.success) {
        console.error(`Birdeye API error: ${result.message}`);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error("Birdeye getMemeTokenDetail error:", error);
      return null;
    }
  }

  /**
   * Get list of meme tokens
   * Endpoint: GET /defi/v3/token/meme/list
   */
  async getMemeTokenList(params?: {
    platform?: string; // pump_dot_fun, moonshot, raydium_launchlab, etc.
    sort_by?: "price" | "volume24h" | "marketCap" | "holder" | "createdAt" | "popularityScore";
    sort_type?: "asc" | "desc";
    offset?: number;
    limit?: number;
  }): Promise<BirdeyeMemeToken[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.platform) searchParams.set("platform", params.platform);
      if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
      if (params?.sort_type) searchParams.set("sort_type", params.sort_type);
      if (params?.offset !== undefined) searchParams.set("offset", params.offset.toString());
      if (params?.limit !== undefined) searchParams.set("limit", params.limit.toString());

      const response = await fetch(
        `${BIRDEYE_API}/defi/v3/token/meme/list?${searchParams}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error(`Birdeye API error: ${response.status}`);
        return [];
      }

      const result: BirdeyeResponse<{ items: BirdeyeMemeToken[] }> = await response.json();

      if (!result.success) {
        console.error(`Birdeye API error: ${result.message}`);
        return [];
      }

      return result.data.items || [];
    } catch (error) {
      console.error("Birdeye getMemeTokenList error:", error);
      return [];
    }
  }

  /**
   * Get token overview (general endpoint, works for any token)
   * Endpoint: GET /defi/token_overview
   */
  async getTokenOverview(address: string): Promise<BirdeyeTokenInfo | null> {
    try {
      const response = await fetch(
        `${BIRDEYE_API}/defi/token_overview?address=${address}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error(`Birdeye API error: ${response.status}`);
        return null;
      }

      const result: BirdeyeResponse<BirdeyeTokenInfo> = await response.json();

      if (!result.success) {
        console.error(`Birdeye API error: ${result.message}`);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error("Birdeye getTokenOverview error:", error);
      return null;
    }
  }

  /**
   * Get token price
   * Endpoint: GET /defi/price
   */
  async getTokenPrice(address: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${BIRDEYE_API}/defi/price?address=${address}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return null;
      }

      const result: BirdeyeResponse<{ value: number }> = await response.json();

      if (!result.success) {
        return null;
      }

      return result.data.value;
    } catch (error) {
      console.error("Birdeye getTokenPrice error:", error);
      return null;
    }
  }

  /**
   * Get multiple token prices
   * Endpoint: GET /defi/multi_price
   */
  async getMultipleTokenPrices(addresses: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    try {
      const response = await fetch(
        `${BIRDEYE_API}/defi/multi_price?list_address=${addresses.join(",")}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return prices;
      }

      const result: BirdeyeResponse<Record<string, { value: number }>> = await response.json();

      if (!result.success || !result.data) {
        return prices;
      }

      for (const [address, data] of Object.entries(result.data)) {
        if (data?.value) {
          prices.set(address, data.value);
        }
      }

      return prices;
    } catch (error) {
      console.error("Birdeye getMultipleTokenPrices error:", error);
      return prices;
    }
  }

  /**
   * Get OHLCV (candlestick) data for a token
   * Endpoint: GET /defi/ohlcv
   */
  async getOHLCV(params: {
    address: string;
    type?: OHLCVInterval;
    time_from?: number;
    time_to?: number;
  }): Promise<BirdeyeOHLCV[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("address", params.address);
      searchParams.set("type", params.type || "1m");

      if (params.time_from) {
        searchParams.set("time_from", params.time_from.toString());
      }
      if (params.time_to) {
        searchParams.set("time_to", params.time_to.toString());
      }

      const response = await fetch(
        `${BIRDEYE_API}/defi/ohlcv?${searchParams}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error(`Birdeye OHLCV API error: ${response.status}`);
        return [];
      }

      const result: BirdeyeResponse<{ items: BirdeyeOHLCV[] }> = await response.json();

      if (!result.success || !result.data?.items) {
        console.error(`Birdeye OHLCV API error: ${result.message}`);
        return [];
      }

      return result.data.items;
    } catch (error) {
      console.error("Birdeye getOHLCV error:", error);
      return [];
    }
  }

  /**
   * Get OHLCV V3 (newer endpoint with more intervals)
   * Endpoint: GET /defi/v3/ohlcv
   */
  async getOHLCVv3(params: {
    address: string;
    type?: OHLCVInterval | "1s" | "15s" | "30s";
    time_from?: number;
    time_to?: number;
  }): Promise<BirdeyeOHLCV[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("address", params.address);
      searchParams.set("type", params.type || "1m");

      if (params.time_from) {
        searchParams.set("time_from", params.time_from.toString());
      }
      if (params.time_to) {
        searchParams.set("time_to", params.time_to.toString());
      }

      const response = await fetch(
        `${BIRDEYE_API}/defi/v3/ohlcv?${searchParams}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error(`Birdeye OHLCV V3 API error: ${response.status}`);
        return [];
      }

      const result: BirdeyeResponse<{ items: BirdeyeOHLCV[] }> = await response.json();

      if (!result.success || !result.data?.items) {
        console.error(`Birdeye OHLCV V3 API error: ${result.message}`);
        return [];
      }

      return result.data.items;
    } catch (error) {
      console.error("Birdeye getOHLCVv3 error:", error);
      return [];
    }
  }
  /**
   * Get recent trades for a token
   * Endpoint: GET /defi/txs/token
   */
  async getTokenTrades(params: {
    address: string;
    tx_type?: "swap" | "add" | "remove" | "all";
    limit?: number;
    offset?: number;
  }): Promise<BirdeyeTrade[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("address", params.address);
      searchParams.set("tx_type", params.tx_type || "swap");
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.offset) searchParams.set("offset", params.offset.toString());

      const response = await fetch(
        `${BIRDEYE_API}/defi/txs/token?${searchParams}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.error(`Birdeye trades API error: ${response.status}`);
        return [];
      }

      const result: BirdeyeResponse<{ items: BirdeyeTrade[] }> = await response.json();

      if (!result.success || !result.data?.items) {
        console.error(`Birdeye trades API error: ${result.message}`);
        return [];
      }

      return result.data.items;
    } catch (error) {
      console.error("Birdeye getTokenTrades error:", error);
      return [];
    }
  }
}

export const birdeye = new BirdeyeClient();
