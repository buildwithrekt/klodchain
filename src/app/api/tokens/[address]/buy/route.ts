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
// price = base_price + (circulating / total) * multiplier
const BASE_PRICE = 0.000001; // Starting price
const MULTIPLIER = 0.01; // Max additional price

function calculatePrice(circulatingSupply: number, totalSupply: number): number {
  return BASE_PRICE + (circulatingSupply / totalSupply) * MULTIPLIER;
}

function calculateTokensForKlod(
  klodAmount: number,
  circulatingSupply: number,
  totalSupply: number
): { tokens: number; avgPrice: number } {
  // Simplified: use current price for small purchases
  const currentPrice = calculatePrice(circulatingSupply, totalSupply);
  const tokens = Math.floor((klodAmount / currentPrice) * 1_000_000); // 6 decimals
  return { tokens, avgPrice: currentPrice };
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

    // Calculate tokens to receive
    const { tokens: tokenAmount, avgPrice } = calculateTokensForKlod(
      klodAmount,
      token.circulating_supply,
      token.total_supply
    );

    if (tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount too small" },
        { status: 400 }
      );
    }

    // Check if enough supply available
    const availableSupply = token.total_supply - token.circulating_supply;
    if (tokenAmount > availableSupply) {
      return NextResponse.json(
        { success: false, error: "Not enough tokens available" },
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
      .from("token_holdings")
      .select("*")
      .eq("token_address", address)
      .eq("wallet_pubkey", walletPubkey)
      .single();

    if (existingHolding) {
      await supabaseAdmin
        .from("token_holdings")
        .update({
          amount: existingHolding.amount + tokenAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingHolding.id);
    } else {
      await supabaseAdmin.from("token_holdings").insert({
        token_address: address,
        wallet_pubkey: walletPubkey,
        amount: tokenAmount,
      });
    }

    // Update token stats
    const newCirculating = token.circulating_supply + tokenAmount;
    const newPrice = calculatePrice(newCirculating, token.total_supply);
    const newMarketCap = (newCirculating / 1_000_000) * newPrice;

    await supabaseAdmin
      .from("tokens")
      .update({
        circulating_supply: newCirculating,
        price: newPrice,
        market_cap: newMarketCap,
        volume_24h: (token.volume_24h || 0) + klodAmount / 1_000_000,
      })
      .eq("address", address);

    // Create trade record
    const signature = generateSignature();
    await supabaseAdmin.from("token_trades").insert({
      token_address: address,
      trader_pubkey: walletPubkey,
      trade_type: "buy",
      klod_amount: klodAmount * 1_000_000, // Store in base units
      token_amount: tokenAmount,
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
      transaction_type: "token_buy",
      from_pubkey: walletPubkey,
      to_pubkey: address,
      amount: klodAmount * 1_000_000,
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_buy",
        token_address: address,
        token_symbol: token.symbol,
        klod_spent: klodAmount,
        tokens_received: tokenAmount / 1_000_000,
        price_per_token: avgPrice,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trade: {
        signature,
        klodSpent: klodAmount,
        tokensReceived: tokenAmount / 1_000_000,
        pricePerToken: avgPrice,
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
