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

// Virtual AMM constant product formula: x * y = k (pump.fun style)
// When selling tokens for USDK:
// - Add tokens to virtual_token_reserve
// - Remove USDK from virtual_usdk_reserve (maintaining k)
function calculateSellOutput(
  tokensIn: number,
  virtualUsdkReserve: number,
  virtualTokenReserve: number
): { usdkOut: number; newUsdkReserve: number; newTokenReserve: number; pricePerToken: number } {
  const k = virtualUsdkReserve * virtualTokenReserve;
  const newTokenReserve = virtualTokenReserve + tokensIn;
  const newUsdkReserve = k / newTokenReserve;
  const usdkOut = virtualUsdkReserve - newUsdkReserve;
  const pricePerToken = usdkOut / (tokensIn / 1_000_000); // Price per whole token in USDK

  return {
    usdkOut,
    newUsdkReserve,
    newTokenReserve,
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

    // Check if token is graduated (liquidity moved to real DEX)
    if (token.is_graduated) {
      return NextResponse.json(
        { success: false, error: "Token has graduated. Trade on DEX." },
        { status: 400 }
      );
    }

    // Use virtual pool reserves (pump.fun style bonding curve)
    // Default: 4000 USDK + 1B tokens = $4000 initial market cap
    const virtualUsdkReserve = Number(token.virtual_usdk_reserve) || 4000;
    const virtualTokenReserve = Number(token.virtual_token_reserve) || 1000000000000000;

    // Calculate USDK to receive using virtual AMM formula
    const { usdkOut, newUsdkReserve, newTokenReserve, pricePerToken } = calculateSellOutput(
      tokenAmountBase,
      virtualUsdkReserve,
      virtualTokenReserve
    );

    if (usdkOut <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount too small" },
        { status: 400 }
      );
    }

    // Floor USDK amount for integer storage
    const usdkOutFloor = Math.floor(usdkOut);

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

    // Add USDK to wallet balance (wallet holds USDK as integer)
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance + usdkOutFloor,
        transaction_count: wallet.transaction_count + 1,
        total_received: wallet.total_received + usdkOutFloor,
      })
      .eq("pubkey", walletPubkey);

    if (updateError) {
      console.error("Failed to update wallet balance:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update wallet balance" },
        { status: 500 }
      );
    }

    // Calculate new price from virtual pool reserves
    const newPrice = newUsdkReserve / (newTokenReserve / 1_000_000);
    const newCirculating = token.circulating_supply - tokenAmountBase;
    const totalSupply = Number(token.total_supply) || 1000000000000000;
    const newMarketCap = (totalSupply / 1_000_000) * newPrice;

    // Update token with new virtual pool reserves and stats
    await supabaseAdmin
      .from("memecoins")
      .update({
        virtual_usdk_reserve: newUsdkReserve,
        virtual_token_reserve: newTokenReserve,
        circulating_supply: newCirculating,
        price: newPrice,
        market_cap: newMarketCap,
        volume_24h: (token.volume_24h || 0) + usdkOutFloor,
      })
      .eq("address", address);

    // Create trade record
    const signature = generateSignature();
    await supabaseAdmin.from("memecoin_trades").insert({
      memecoin_address: address,
      trader_pubkey: walletPubkey,
      trade_type: "sell",
      usdk_amount: usdkOutFloor * 1_000_000,
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
      amount: usdkOutFloor * 1_000_000, // Store USDK amount in base units
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_sell",
        memecoin_address: address,
        token_symbol: token.symbol,
        tokens_sold: tokenAmount,
        usdk_received: usdkOutFloor,
        price_per_token: pricePerToken,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trade: {
        signature,
        tokensSold: tokenAmount,
        usdkReceived: usdkOutFloor,
        pricePerToken,
        newBalance: wallet.balance + usdkOutFloor,
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
