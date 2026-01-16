import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);

    // Pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const order = searchParams.get("order") === "asc" ? true : false;

    const { data, error, count } = await supabase
      .from("blocks")
      .select("*", { count: "exact" })
      .order("slot", { ascending: order })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
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
