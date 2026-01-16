import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slot: string }> }
) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Maximum 10 requests per minute. Please wait before retrying.",
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = await createClient();
    const { slot } = await params;
    const slotNumber = parseInt(slot);

    if (isNaN(slotNumber)) {
      return NextResponse.json(
        { error: "Invalid slot", message: "Slot must be a valid number" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Get block
    const { data: block, error: blockError } = await supabase
      .from("blocks")
      .select("*")
      .eq("slot", slotNumber)
      .single();

    if (blockError || !block) {
      return NextResponse.json(
        { error: "Block not found", message: `No block found at slot ${slotNumber}` },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Get transactions in this block
    const { data: transactions } = await supabase
      .from("transactions")
      .select("signature, transaction_type, from_pubkey, to_pubkey, amount, fee, status")
      .eq("slot", slotNumber)
      .order("block_index", { ascending: true });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...block,
          transactions: transactions || [],
        },
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getRateLimitHeaders(rateLimit) }
    );
  }
}
