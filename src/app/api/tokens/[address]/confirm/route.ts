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
    const { signature, imageUrl } = await req.json();

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Transaction signature is required" },
        { status: 400 }
      );
    }

    // Verify token exists in our DB
    const { data: token, error: tokenError } = await supabaseAdmin
      .from("created_tokens")
      .select("*")
      .eq("mint_address", address)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // Fetch token info from Pump.fun to get stats
    let tokenInfo;
    try {
      tokenInfo = await pumpPortal.getTokenInfo(address);
    } catch (error) {
      console.error("Failed to fetch token info from Pump.fun:", error);
      // Token might not be indexed yet, update with signature only
    }

    // Update token with confirmation data
    const updateData: Record<string, unknown> = {
      creation_signature: signature,
      updated_at: new Date().toISOString(),
    };

    if (imageUrl) {
      updateData.image_url = imageUrl;
    }

    if (tokenInfo) {
      updateData.bonding_curve = tokenInfo.bonding_curve;
      updateData.associated_bonding_curve = tokenInfo.associated_bonding_curve;
      updateData.image_url = tokenInfo.image_uri;
      updateData.price_sol = tokenInfo.market_cap / (tokenInfo.total_supply / 1e6);
      updateData.market_cap_sol = tokenInfo.market_cap;
      updateData.market_cap_usd = tokenInfo.usd_market_cap;
      updateData.virtual_sol_reserves = tokenInfo.virtual_sol_reserves;
      updateData.virtual_token_reserves = tokenInfo.virtual_token_reserves;
      updateData.total_supply = tokenInfo.total_supply;
      updateData.is_graduated = tokenInfo.complete;
      updateData.raydium_pool = tokenInfo.raydium_pool;
    }

    const { error: updateError } = await supabaseAdmin
      .from("created_tokens")
      .update(updateData)
      .eq("mint_address", address);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to confirm token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: {
        ...token,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Confirm error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
