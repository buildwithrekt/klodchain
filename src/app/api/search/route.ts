import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchResult {
  type: "block" | "transaction" | "account" | "validator" | "program";
  url: string;
  label: string;
  sublabel?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  try {
    // Check if it's a slot number
    if (/^\d+$/.test(query)) {
      const slot = parseInt(query);
      const { data: block } = await supabase
        .from("blocks")
        .select("slot, blockhash")
        .eq("slot", slot)
        .single();

      if (block) {
        results.push({
          type: "block",
          url: `/explorer/block/${slot}`,
          label: `Block #${slot.toLocaleString()}`,
          sublabel: block.blockhash.slice(0, 16) + "...",
        });
      }
    }

    // Search transactions by signature (partial match)
    const { data: txBySignature } = await supabase
      .from("transactions")
      .select("signature, status, transaction_type, from_pubkey")
      .ilike("signature", `%${query}%`)
      .limit(5);

    if (txBySignature) {
      for (const tx of txBySignature) {
        results.push({
          type: "transaction",
          url: `/explorer/tx/${tx.signature}`,
          label: `TX ${tx.signature.slice(0, 12)}...${tx.signature.slice(-8)}`,
          sublabel: `${tx.transaction_type} • ${tx.status}`,
        });
      }
    }

    // Search blocks by blockhash (partial match)
    const { data: blocksByHash } = await supabase
      .from("blocks")
      .select("slot, blockhash, leader_pubkey")
      .ilike("blockhash", `%${query}%`)
      .limit(5);

    if (blocksByHash) {
      for (const block of blocksByHash) {
        // Avoid duplicates if already found by slot
        if (!results.find(r => r.url === `/explorer/block/${block.slot}`)) {
          results.push({
            type: "block",
            url: `/explorer/block/${block.slot}`,
            label: `Block #${block.slot.toLocaleString()}`,
            sublabel: block.blockhash.slice(0, 20) + "...",
          });
        }
      }
    }

    // Search transactions by from_pubkey (partial match)
    const { data: txByFrom } = await supabase
      .from("transactions")
      .select("from_pubkey")
      .ilike("from_pubkey", `%${query}%`)
      .limit(5);

    if (txByFrom) {
      const uniquePubkeys = [...new Set(txByFrom.map(t => t.from_pubkey))];
      for (const pubkey of uniquePubkeys) {
        if (!results.find(r => r.url === `/explorer/account/${pubkey}`)) {
          results.push({
            type: "account",
            url: `/explorer/account/${pubkey}`,
            label: `Account ${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`,
            sublabel: "Sender",
          });
        }
      }
    }

    // Search transactions by to_pubkey (partial match)
    const { data: txByTo } = await supabase
      .from("transactions")
      .select("to_pubkey")
      .not("to_pubkey", "is", null)
      .ilike("to_pubkey", `%${query}%`)
      .limit(5);

    if (txByTo) {
      const uniquePubkeys = [...new Set(txByTo.map(t => t.to_pubkey).filter(Boolean))];
      for (const pubkey of uniquePubkeys) {
        if (!results.find(r => r.url === `/explorer/account/${pubkey}`)) {
          results.push({
            type: "account",
            url: `/explorer/account/${pubkey}`,
            label: `Account ${pubkey!.slice(0, 8)}...${pubkey!.slice(-4)}`,
            sublabel: "Recipient",
          });
        }
      }
    }

    // Search validators by pubkey or name
    const { data: validators } = await supabase
      .from("validators")
      .select("pubkey, name, stake")
      .or(`pubkey.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(5);

    if (validators) {
      for (const v of validators) {
        if (!results.find(r => r.url === `/explorer/account/${v.pubkey}`)) {
          results.push({
            type: "validator",
            url: `/explorer/account/${v.pubkey}`,
            label: v.name || `Validator ${v.pubkey.slice(0, 8)}...`,
            sublabel: `Stake: ${(v.stake / 1e9).toFixed(2)} KLOD`,
          });
        }
      }
    }

    // Search blocks by leader_pubkey (partial match)
    const { data: blocksByLeader } = await supabase
      .from("blocks")
      .select("leader_pubkey")
      .ilike("leader_pubkey", `%${query}%`)
      .limit(5);

    if (blocksByLeader) {
      const uniqueLeaders = [...new Set(blocksByLeader.map(b => b.leader_pubkey))];
      for (const pubkey of uniqueLeaders) {
        if (!results.find(r => r.url === `/explorer/account/${pubkey}`)) {
          results.push({
            type: "account",
            url: `/explorer/account/${pubkey}`,
            label: `Account ${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`,
            sublabel: "Block Leader",
          });
        }
      }
    }

    // Search transactions by program_id (partial match)
    const { data: txByProgram } = await supabase
      .from("transactions")
      .select("program_id")
      .not("program_id", "is", null)
      .ilike("program_id", `%${query}%`)
      .limit(5);

    if (txByProgram) {
      const uniquePrograms = [...new Set(txByProgram.map(t => t.program_id).filter(Boolean))];
      for (const programId of uniquePrograms) {
        if (!results.find(r => r.url === `/explorer/account/${programId}`)) {
          results.push({
            type: "program",
            url: `/explorer/account/${programId}`,
            label: `Program ${programId!.slice(0, 8)}...${programId!.slice(-4)}`,
            sublabel: "Program",
          });
        }
      }
    }

    return NextResponse.json({ results: results.slice(0, 15) });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
