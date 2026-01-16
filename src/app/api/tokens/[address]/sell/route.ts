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

// Bonding curve: price increases as supply is bought
const BASE_PRICE = 0.000001;
const MULTIPLIER = 0.01;

function calculatePrice(circulatingSupply: number, totalSupply: number): number {
  return BASE_PRICE + (circulatingSupply / totalSupply) * MULTIPLIER;
}

function calculateKlodForTokens(
  tokenAmount: number,
  circulatingSupply: number,
  totalSupply: number
): { klod: number; avgPrice: number } {
  const currentPrice = calculatePrice(circulatingSupply, totalSupply);
  const klod = Math.floor((tokenAmount / 1_000_000) * currentPrice * 1_000_000) / 1_000_000;
  return { klod, avgPrice: currentPrice };
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
      .from("tokens")
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
      .from("token_holdings")
      .select("*")
      .eq("token_address", address)
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

    // Calculate KLOD to receive
    const { klod: klodAmount, avgPrice } = calculateKlodForTokens(
      tokenAmountBase,
      token.circulating_supply,
      token.total_supply
    );

    if (klodAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount too small" },
        { status: 400 }
      );
    }

    // Update token holding
    const newHoldingAmount = holding.amount - tokenAmountBase;
    if (newHoldingAmount > 0) {
      await supabaseAdmin
        .from("token_holdings")
        .update({
          amount: newHoldingAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", holding.id);
    } else {
      // Delete holding if zero
      await supabaseAdmin
        .from("token_holdings")
        .delete()
        .eq("id", holding.id);
    }

    // Add KLOD to wallet
    await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance + klodAmount,
        transaction_count: wallet.transaction_count + 1,
        total_received: wallet.total_received + klodAmount,
      })
      .eq("pubkey", walletPubkey);

    // Update token stats
    const newCirculating = token.circulating_supply - tokenAmountBase;
    const newPrice = calculatePrice(newCirculating, token.total_supply);
    const newMarketCap = (newCirculating / 1_000_000) * newPrice;

    await supabaseAdmin
      .from("tokens")
      .update({
        circulating_supply: newCirculating,
        price: newPrice,
        market_cap: newMarketCap,
        volume_24h: (token.volume_24h || 0) + klodAmount,
      })
      .eq("address", address);

    // Create trade record
    const signature = generateSignature();
    await supabaseAdmin.from("token_trades").insert({
      token_address: address,
      trader_pubkey: walletPubkey,
      trade_type: "sell",
      klod_amount: Math.floor(klodAmount * 1_000_000), // Store in base units
      token_amount: tokenAmountBase,
      price_per_token: avgPrice,
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
      amount: Math.floor(klodAmount * 1_000_000),
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_sell",
        token_address: address,
        token_symbol: token.symbol,
        tokens_sold: tokenAmount,
        klod_received: klodAmount,
        price_per_token: avgPrice,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trade: {
        signature,
        tokensSold: tokenAmount,
        klodReceived: klodAmount,
        pricePerToken: avgPrice,
        newKlodBalance: wallet.balance + klodAmount,
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
