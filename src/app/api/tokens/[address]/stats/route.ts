import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Update token stats from WebSocket trade data
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body = await req.json();

    const {
      price_sol,
      market_cap_sol,
      virtual_sol_reserves,
      virtual_token_reserves,
    } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address required" },
        { status: 400 }
      );
    }

    // Update token stats in DB
    const { error } = await supabaseAdmin
      .from("created_tokens")
      .update({
        price_sol,
        market_cap_sol,
        virtual_sol_reserves,
        virtual_token_reserves,
        updated_at: new Date().toISOString(),
      })
      .eq("mint_address", address);

    if (error) {
      console.error("Failed to update token stats:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stats update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
