import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pumpPortal } from "@/lib/pumpportal";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { walletPubkey, solAmount, slippageBps = 500 } = await req.json();

    // Validate inputs
    if (!address) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    if (!walletPubkey) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!solAmount || solAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid SOL amount" },
        { status: 400 }
      );
    }

    // Verify token exists in our DB
    const { data: token, error: tokenError } = await supabaseAdmin
      .from("created_tokens")
      .select("mint_address, name, symbol")
      .eq("mint_address", address)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // Get buy transaction from PumpPortal
    let transaction: string;
    try {
      transaction = await pumpPortal.getBuyTransaction({
        publicKey: walletPubkey,
        mint: address,
        amount: solAmount,
        denominatedInSol: true,
        slippageBps,
      });
    } catch (error) {
      console.error("PumpPortal buy error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create buy transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction, // Base64 encoded, client must sign and send
      token: {
        mint: token.mint_address,
        name: token.name,
        symbol: token.symbol,
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
