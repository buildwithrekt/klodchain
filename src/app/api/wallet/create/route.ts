import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Generate random hex string
function generateHex(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Generate wallet address (claude_xxx format)
function generateWalletAddress(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
  let address = "klod_";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    address += chars[array[i] % chars.length];
  }
  return address;
}

export async function POST() {
  try {
    const supabase = supabaseAdmin;

    // Generate keypair
    const pubkey = generateWalletAddress();
    const privateKey = generateHex(32); // 64 char hex string

    // Create wallet in database
    const { data, error } = await supabase
      .from("wallets")
      .insert({
        pubkey,
        private_key: privateKey,
        balance: 0,
        transaction_count: 0,
        total_received: 0,
        total_sent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating wallet:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create wallet" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: {
        pubkey: data.pubkey,
        privateKey: data.private_key, // Only returned on creation!
        balance: data.balance,
      },
    });
  } catch (error) {
    console.error("Wallet creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
