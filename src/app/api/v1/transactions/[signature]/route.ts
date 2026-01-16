import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ signature: string }> }
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
    const { signature } = await params;

    if (!signature || signature.length < 10) {
      return NextResponse.json(
        { error: "Invalid signature", message: "Please provide a valid transaction signature" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("signature", signature)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Transaction not found", message: `No transaction found with signature ${signature}` },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
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
