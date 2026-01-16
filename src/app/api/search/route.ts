import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    // Check if it's a slot number
    if (/^\d+$/.test(query)) {
      const slot = parseInt(query);
      const { data: block } = await supabase
        .from("blocks")
        .select("slot")
        .eq("slot", slot)
        .single();

      if (block) {
        return NextResponse.json({
          type: "block",
          url: `/explorer/block/${slot}`,
          match: `Block #${slot}`,
        });
      }
    }

    // Search transactions by signature (exact match)
    const { data: txBySignature } = await supabase
      .from("transactions")
      .select("signature")
      .eq("signature", query)
      .single();

    if (txBySignature) {
      return NextResponse.json({
        type: "transaction",
        url: `/explorer/tx/${query}`,
        match: `Transaction ${query.slice(0, 16)}...`,
      });
    }

    // Search blocks by blockhash (exact match)
    const { data: blockByHash } = await supabase
      .from("blocks")
      .select("slot, blockhash")
      .eq("blockhash", query)
      .single();

    if (blockByHash) {
      return NextResponse.json({
        type: "block",
        url: `/explorer/block/${blockByHash.slot}`,
        match: `Block #${blockByHash.slot}`,
      });
    }

    // Search transactions by from_pubkey or to_pubkey
    const { data: txByPubkey } = await supabase
      .from("transactions")
      .select("signature, from_pubkey, to_pubkey")
      .or(`from_pubkey.eq.${query},to_pubkey.eq.${query}`)
      .limit(1)
      .single();

    if (txByPubkey) {
      return NextResponse.json({
        type: "account",
        url: `/explorer/account/${query}`,
        match: `Account ${query.slice(0, 8)}...${query.slice(-4)}`,
      });
    }

    // Search validators by pubkey
    const { data: validator } = await supabase
      .from("validators")
      .select("pubkey, name")
      .eq("pubkey", query)
      .single();

    if (validator) {
      return NextResponse.json({
        type: "validator",
        url: `/explorer/account/${query}`,
        match: `Validator ${validator.name || query.slice(0, 8)}...`,
      });
    }

    // Search blocks by leader_pubkey
    const { data: blockByLeader } = await supabase
      .from("blocks")
      .select("slot, leader_pubkey")
      .eq("leader_pubkey", query)
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    if (blockByLeader) {
      return NextResponse.json({
        type: "account",
        url: `/explorer/account/${query}`,
        match: `Leader ${query.slice(0, 8)}...${query.slice(-4)}`,
      });
    }

    // Search transactions by program_id
    const { data: txByProgram } = await supabase
      .from("transactions")
      .select("signature, program_id")
      .eq("program_id", query)
      .limit(1)
      .single();

    if (txByProgram) {
      return NextResponse.json({
        type: "program",
        url: `/explorer/account/${query}`,
        match: `Program ${query.slice(0, 8)}...${query.slice(-4)}`,
      });
    }

    // Partial search - try to find transactions with signature starting with query
    if (query.length >= 8) {
      const { data: partialTx } = await supabase
        .from("transactions")
        .select("signature")
        .ilike("signature", `${query}%`)
        .limit(1)
        .single();

      if (partialTx) {
        return NextResponse.json({
          type: "transaction",
          url: `/explorer/tx/${partialTx.signature}`,
          match: `Transaction ${partialTx.signature.slice(0, 16)}...`,
        });
      }

      // Partial search for blockhash
      const { data: partialBlock } = await supabase
        .from("blocks")
        .select("slot, blockhash")
        .ilike("blockhash", `${query}%`)
        .limit(1)
        .single();

      if (partialBlock) {
        return NextResponse.json({
          type: "block",
          url: `/explorer/block/${partialBlock.slot}`,
          match: `Block #${partialBlock.slot}`,
        });
      }
    }

    // Nothing found
    return NextResponse.json({ type: "not_found", match: null });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
