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
// When buying tokens with USDK:
// - Add USDK to virtual_usdk_reserve
// - Remove tokens from virtual_token_reserve (maintaining k)
function calculateBuyOutput(
  usdkIn: number,
  virtualUsdkReserve: number,
  virtualTokenReserve: number
): { tokensOut: number; newUsdkReserve: number; newTokenReserve: number; pricePerToken: number } {
  const k = virtualUsdkReserve * virtualTokenReserve;
  const newUsdkReserve = virtualUsdkReserve + usdkIn;
  const newTokenReserve = k / newUsdkReserve;
  const tokensOut = virtualTokenReserve - newTokenReserve;
  const pricePerToken = usdkIn / (tokensOut / 1_000_000); // Price per whole token in USDK

  return {
    tokensOut: Math.floor(tokensOut),
    newUsdkReserve,
    newTokenReserve: Math.floor(newTokenReserve),
    pricePerToken,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { walletPubkey, klodAmount, usdkAmount } = await req.json();
    // Wallet holds USDK directly - support both param names for compatibility
    const amount = usdkAmount || klodAmount;

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

    if (!amount || amount <= 0) {
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

    if (wallet.balance < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient USDK balance" },
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

    // Calculate tokens to receive using virtual AMM formula (wallet and pool both use USDK)
    const { tokensOut, newUsdkReserve, newTokenReserve, pricePerToken } = calculateBuyOutput(
      amount,
      virtualUsdkReserve,
      virtualTokenReserve
    );

    if (tokensOut <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount too small" },
        { status: 400 }
      );
    }

    // Deduct USDK from wallet balance
    const { error: deductError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance - amount,
        transaction_count: wallet.transaction_count + 1,
        total_sent: wallet.total_sent + amount,
      })
      .eq("pubkey", walletPubkey);

    if (deductError) {
      return NextResponse.json(
        { success: false, error: "Failed to deduct USDK" },
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

    // Calculate new price from virtual pool reserves (price in USDK)
    const newPrice = newUsdkReserve / (newTokenReserve / 1_000_000);
    const newCirculating = token.circulating_supply + tokensOut;
    const totalSupply = Number(token.total_supply) || 1000000000000000;
    const newMarketCap = (totalSupply / 1_000_000) * newPrice;
    const totalUsdkRaised = Number(token.total_usdk_raised || 0) + amount;

    // Check for graduation (market cap >= threshold)
    const graduationThreshold = Number(token.graduation_threshold) || 69000;
    const shouldGraduate = newMarketCap >= graduationThreshold;

    // Update token with new virtual pool reserves and stats
    await supabaseAdmin
      .from("memecoins")
      .update({
        virtual_usdk_reserve: newUsdkReserve,
        virtual_token_reserve: newTokenReserve,
        circulating_supply: newCirculating,
        price: newPrice,
        market_cap: newMarketCap,
        volume_24h: (token.volume_24h || 0) + amount,
        total_usdk_raised: totalUsdkRaised,
        ...(shouldGraduate && { is_graduated: true, graduated_at: new Date().toISOString() }),
      })
      .eq("address", address);

    // Create trade record
    const signature = generateSignature();
    await supabaseAdmin.from("memecoin_trades").insert({
      memecoin_address: address,
      trader_pubkey: walletPubkey,
      trade_type: "buy",
      usdk_amount: Math.floor(amount * 1_000_000), // Store USDK in base units
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
      amount: amount * 1_000_000, // Store USDK amount in base units
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_buy",
        memecoin_address: address,
        token_symbol: token.symbol,
        usdk_spent: amount,
        tokens_received: tokensOut / 1_000_000,
        price_per_token: pricePerToken,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      trade: {
        signature,
        usdkSpent: amount,
        tokensReceived: tokensOut / 1_000_000,
        pricePerToken,
        newBalance: wallet.balance - amount,
        graduated: shouldGraduate,
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
