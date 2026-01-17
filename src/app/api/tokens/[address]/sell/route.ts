import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Generate transaction signature
function generateSignature(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let signature = "";
  const array = new Uint8Array(88);
  crypto.getRandomValues(array);
  for (let i = 0; i < 88; i++) {
    signature += chars[array[i] % chars.length];
  }
  return signature;
}

// AMM constant product formula: x * y = k
// When selling tokens for KLOD:
// - Add tokens to reserve_token
// - Remove KLOD from reserve_klod (maintaining k)
function calculateSellOutput(
  tokensIn: number,
  reserveKlod: number,
  reserveToken: number
): { klodOut: number; newReserveKlod: number; newReserveToken: number; pricePerToken: number } {
  const k = reserveKlod * reserveToken;
  const newReserveToken = reserveToken + tokensIn;
  const newReserveKlod = k / newReserveToken;
  const klodOut = reserveKlod - newReserveKlod;
  const pricePerToken = klodOut / (tokensIn / 1_000_000); // Price per whole token

  return {
    klodOut,
    newReserveKlod,
    newReserveToken,
    pricePerToken,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { walletPubkey, tokenAmount } = await req.json();

    // Validate inputs
    if (!address || !address.endsWith("klod")) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    if (!walletPubkey || !walletPubkey.startsWith("klod_")) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    if (!tokenAmount || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Convert to base units (6 decimals)
    const tokenAmountBase = Math.floor(tokenAmount * 1_000_000);

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("pubkey", walletPubkey)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Get token
    const { data: token, error: tokenError } = await supabaseAdmin
      .from("memecoins")
      .select("*")
      .eq("address", address)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // Get user's token holding
    const { data: holding, error: holdingError } = await supabaseAdmin
      .from("memecoin_holdings")
      .select("*")
      .eq("memecoin_address", address)
      .eq("wallet_pubkey", walletPubkey)
      .single();

    if (holdingError || !holding) {
      return NextResponse.json(
        { success: false, error: "You don't own any of this token" },
        { status: 400 }
      );
    }

    if (holding.amount < tokenAmountBase) {
      return NextResponse.json(
        { success: false, error: "Insufficient token balance" },
        { status: 400 }
      );
    }

    // Use pool reserves (default to initial values if not set)
    const reserveKlod = Number(token.reserve_klod) || 4000;
    const reserveToken = Number(token.reserve_token) || 800000000000000;

    // Calculate KLOD to receive using AMM formula
    const { klodOut, newReserveKlod, newReserveToken, pricePerToken } = calculateSellOutput(
      tokenAmountBase,
      reserveKlod,
      reserveToken
    );

    if (klodOut <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount too small" },
        { status: 400 }
      );
    }

    // Update token holding
    const newHoldingAmount = holding.amount - tokenAmountBase;
    if (newHoldingAmount > 0) {
      await supabaseAdmin
        .from("memecoin_holdings")
        .update({
          amount: newHoldingAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", holding.id);
    } else {
      // Delete holding if zero
      await supabaseAdmin
        .from("memecoin_holdings")
        .delete()
        .eq("id", holding.id);
    }

    // Add KLOD to wallet
    await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance + klodOut,
        transaction_count: wallet.transaction_count + 1,
        total_received: wallet.total_received + klodOut,
      })
      .eq("pubkey", walletPubkey);

    // Calculate new price from pool reserves
    const newPrice = newReserveKlod / (newReserveToken / 1_000_000);
    const newCirculating = token.circulating_supply - tokenAmountBase;
    const newMarketCap = (newCirculating / 1_000_000) * newPrice;

    // Update token with new pool reserves and stats
    await supabaseAdmin
      .from("memecoins")
      .update({
        reserve_klod: newReserveKlod,
        reserve_token: newReserveToken,
        circulating_supply: newCirculating,
        price: newPrice,
        market_cap: newMarketCap,
        volume_24h: (token.volume_24h || 0) + klodOut,
      })
      .eq("address", address);

    // Create trade record
    const signature = generateSignature();
    await supabaseAdmin.from("memecoin_trades").insert({
      memecoin_address: address,
      trader_pubkey: walletPubkey,
      trade_type: "sell",
      klod_amount: Math.floor(klodOut * 1_000_000),
      token_amount: tokenAmountBase,
      price_per_token: pricePerToken,
      signature,
    });

    // Create blockchain transaction
    const { data: latestBlock } = await supabaseAdmin
      .from("blocks")
      .select("slot")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    await supabaseAdmin.from("transactions").insert({
      signature,
      slot: latestBlock?.slot || null,
      fee: 0,
      status: "confirmed",
      transaction_type: "token_sell",
      from_pubkey: walletPubkey,
      to_pubkey: address,
      amount: Math.floor(klodOut * 1_000_000),
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_sell",
        memecoin_address: address,
        token_symbol: token.symbol,
        tokens_sold: tokenAmount,
        klod_received: klodOut,
        price_per_token: pricePerToken,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trade: {
        signature,
        tokensSold: tokenAmount,
        klodReceived: klodOut,
        pricePerToken,
        newKlodBalance: wallet.balance + klodOut,
      },
    });
  } catch (error) {
    console.error("Token sell error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
