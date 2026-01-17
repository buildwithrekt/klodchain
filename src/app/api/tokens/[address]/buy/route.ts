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
// When buying tokens with KLOD:
// - Add KLOD to reserve_klod
// - Remove tokens from reserve_token (maintaining k)
function calculateBuyOutput(
  klodIn: number,
  reserveKlod: number,
  reserveToken: number
): { tokensOut: number; newReserveKlod: number; newReserveToken: number; pricePerToken: number } {
  const k = reserveKlod * reserveToken;
  const newReserveKlod = reserveKlod + klodIn;
  const newReserveToken = k / newReserveKlod;
  const tokensOut = reserveToken - newReserveToken;
  const pricePerToken = klodIn / (tokensOut / 1_000_000); // Price per whole token

  return {
    tokensOut: Math.floor(tokensOut),
    newReserveKlod,
    newReserveToken: Math.floor(newReserveToken),
    pricePerToken,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { walletPubkey, klodAmount } = await req.json();

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

    if (!klodAmount || klodAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

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

    if (wallet.balance < klodAmount) {
      return NextResponse.json(
        { success: false, error: "Insufficient KLOD balance" },
        { status: 400 }
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

    // Use pool reserves (default to initial values if not set)
    const reserveKlod = Number(token.reserve_klod) || 4000;
    const reserveToken = Number(token.reserve_token) || 800000000000000;

    // Calculate tokens to receive using AMM formula
    const { tokensOut, newReserveKlod, newReserveToken, pricePerToken } = calculateBuyOutput(
      klodAmount,
      reserveKlod,
      reserveToken
    );

    if (tokensOut <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount too small" },
        { status: 400 }
      );
    }

    // Deduct KLOD from wallet
    const { error: deductError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance - klodAmount,
        transaction_count: wallet.transaction_count + 1,
        total_sent: wallet.total_sent + klodAmount,
      })
      .eq("pubkey", walletPubkey);

    if (deductError) {
      return NextResponse.json(
        { success: false, error: "Failed to deduct KLOD" },
        { status: 500 }
      );
    }

    // Update or create token holding
    const { data: existingHolding } = await supabaseAdmin
      .from("memecoin_holdings")
      .select("*")
      .eq("memecoin_address", address)
      .eq("wallet_pubkey", walletPubkey)
      .single();

    if (existingHolding) {
      await supabaseAdmin
        .from("memecoin_holdings")
        .update({
          amount: existingHolding.amount + tokensOut,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingHolding.id);
    } else {
      await supabaseAdmin.from("memecoin_holdings").insert({
        memecoin_address: address,
        wallet_pubkey: walletPubkey,
        amount: tokensOut,
      });
    }

    // Calculate new price from pool reserves
    const newPrice = newReserveKlod / (newReserveToken / 1_000_000);
    const newCirculating = token.circulating_supply + tokensOut;
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
        volume_24h: (token.volume_24h || 0) + klodAmount,
      })
      .eq("address", address);

    // Create trade record
    const signature = generateSignature();
    await supabaseAdmin.from("memecoin_trades").insert({
      memecoin_address: address,
      trader_pubkey: walletPubkey,
      trade_type: "buy",
      klod_amount: klodAmount * 1_000_000,
      token_amount: tokensOut,
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
      transaction_type: "token_buy",
      from_pubkey: walletPubkey,
      to_pubkey: address,
      amount: klodAmount * 1_000_000,
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_buy",
        memecoin_address: address,
        token_symbol: token.symbol,
        klod_spent: klodAmount,
        tokens_received: tokensOut / 1_000_000,
        price_per_token: pricePerToken,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trade: {
        signature,
        klodSpent: klodAmount,
        tokensReceived: tokensOut / 1_000_000,
        pricePerToken,
        newBalance: wallet.balance - klodAmount,
      },
    });
  } catch (error) {
    console.error("Token buy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
