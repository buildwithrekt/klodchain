"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PUMPPORTAL_API_KEY = process.env.NEXT_PUBLIC_PUMPPORTAL_API_KEY;
const PUMPPORTAL_WS_URL = PUMPPORTAL_API_KEY
  ? `wss://pumpportal.fun/api/data?api-key=${PUMPPORTAL_API_KEY}`
  : "wss://pumpportal.fun/api/data";

export interface PumpPortalTrade {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: "buy" | "sell";
  tokenAmount: number;
  solAmount: number;
  newTokenBalance: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  timestamp: number;
}

export interface PumpPortalNewToken {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: "create";
  initialBuy: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  name: string;
  symbol: string;
  uri: string;
  timestamp: number;
}

interface UsePumpPortalWSOptions {
  tokenMint?: string;
  onTrade?: (trade: PumpPortalTrade) => void;
  onNewToken?: (token: PumpPortalNewToken) => void;
  enabled?: boolean;
}

export function usePumpPortalWS({
  tokenMint,
  onTrade,
  onNewToken,
  enabled = true,
}: UsePumpPortalWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTrade, setLastTrade] = useState<PumpPortalTrade | null>(null);
  const [trades, setTrades] = useState<PumpPortalTrade[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(PUMPPORTAL_WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Subscribe to token trades if tokenMint is provided
        if (tokenMint) {
          ws.send(
            JSON.stringify({
              method: "subscribeTokenTrade",
              keys: [tokenMint],
            })
          );
        }

        // Subscribe to new tokens if onNewToken callback is provided
        if (onNewToken) {
          ws.send(
            JSON.stringify({
              method: "subscribeNewToken",
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle trade events
          if (data.txType === "buy" || data.txType === "sell") {
            const trade: PumpPortalTrade = {
              signature: data.signature,
              mint: data.mint,
              traderPublicKey: data.traderPublicKey,
              txType: data.txType,
              tokenAmount: data.tokenAmount,
              solAmount: data.solAmount,
              newTokenBalance: data.newTokenBalance,
              bondingCurveKey: data.bondingCurveKey,
              vTokensInBondingCurve: data.vTokensInBondingCurve,
              vSolInBondingCurve: data.vSolInBondingCurve,
              marketCapSol: data.marketCapSol,
              timestamp: Date.now(),
            };

            setLastTrade(trade);
            // Deduplicate by signature
            setTrades((prev) => {
              if (prev.some((t) => t.signature === trade.signature)) {
                return prev;
              }
              return [trade, ...prev].slice(0, 100);
            });
            onTrade?.(trade);
          }

          // Handle new token events
          if (data.txType === "create") {
            const newToken: PumpPortalNewToken = {
              signature: data.signature,
              mint: data.mint,
              traderPublicKey: data.traderPublicKey,
              txType: "create",
              initialBuy: data.initialBuy,
              bondingCurveKey: data.bondingCurveKey,
              vTokensInBondingCurve: data.vTokensInBondingCurve,
              vSolInBondingCurve: data.vSolInBondingCurve,
              marketCapSol: data.marketCapSol,
              name: data.name,
              symbol: data.symbol,
              uri: data.uri,
              timestamp: Date.now(),
            };

            onNewToken?.(newToken);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("PumpPortal WebSocket error:", error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect to PumpPortal WebSocket:", error);
    }
  }, [enabled, tokenMint, onTrade, onNewToken]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Unsubscribe before closing
      if (wsRef.current.readyState === WebSocket.OPEN) {
        if (tokenMint) {
          wsRef.current.send(
            JSON.stringify({
              method: "unsubscribeTokenTrade",
              keys: [tokenMint],
            })
          );
        }
        if (onNewToken) {
          wsRef.current.send(
            JSON.stringify({
              method: "unsubscribeNewToken",
            })
          );
        }
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [tokenMint, onNewToken]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Calculate current price from last trade
  const currentPrice = lastTrade
    ? lastTrade.solAmount / lastTrade.tokenAmount
    : null;

  const marketCapSol = lastTrade?.marketCapSol ?? null;

  return {
    isConnected,
    lastTrade,
    trades,
    currentPrice,
    marketCapSol,
    reconnect: connect,
  };
}
