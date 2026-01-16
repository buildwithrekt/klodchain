import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") === "asc" ? true : false;
    const search = searchParams.get("search");

    let query = supabase
      .from("tokens")
      .select("*", { count: "exact" });

    // Search by name or symbol
    if (search) {
      query = query.or(`name.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    // Sort
    if (sort === "market_cap") {
      query = query.order("market_cap", { ascending: order });
    } else if (sort === "volume") {
      query = query.order("volume_24h", { ascending: order });
    } else if (sort === "price") {
      query = query.order("price", { ascending: order });
    } else {
      query = query.order("created_at", { ascending: order });
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Tokens fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Tokens API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
