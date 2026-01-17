import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Generate a token address ending with "klod"
function generateTokenAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let address = "";
  const array = new Uint8Array(40);
  crypto.getRandomValues(array);
  for (let i = 0; i < 40; i++) {
    address += chars[array[i] % chars.length];
  }
  return address + "klod";
}

// Generate transaction signature
function generateSignature(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let signature = "";
  const array = new Uint8Array(88);
  crypto.getRandomValues(array);
  for (let i = 0; i < 88; i++) {
    signature += chars[array[i] % chars.length];
  }
  return signature;
}

const TOKEN_CREATION_COST = 1; // 1 KLOD

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const symbol = formData.get("symbol") as string;
    const description = formData.get("description") as string | null;
    const twitterUrl = formData.get("twitter_url") as string | null;
    const websiteUrl = formData.get("website_url") as string | null;
    const telegramUrl = formData.get("telegram_url") as string | null;
    const creatorPubkey = formData.get("creator_pubkey") as string;
    const image = formData.get("image") as File | null;

    // Validate required fields
    if (!name || name.length < 1 || name.length > 32) {
      return NextResponse.json(
        { success: false, error: "Name must be 1-32 characters" },
        { status: 400 }
      );
    }

    if (!symbol || symbol.length < 1 || symbol.length > 10) {
      return NextResponse.json(
        { success: false, error: "Symbol must be 1-10 characters" },
        { status: 400 }
      );
    }

    if (!creatorPubkey || !creatorPubkey.startsWith("klod_")) {
      return NextResponse.json(
        { success: false, error: "Invalid creator wallet" },
        { status: 400 }
      );
    }

    // Check creator wallet balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("pubkey", creatorPubkey)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    if (wallet.balance < TOKEN_CREATION_COST) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance. Token creation costs 1 KLOD" },
        { status: 400 }
      );
    }

    // Upload image to Supabase Storage if provided
    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from("token-images")
        .upload(fileName, image, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        // Continue without image if upload fails
      } else {
        const { data: publicUrl } = supabaseAdmin
          .storage
          .from("token-images")
          .getPublicUrl(uploadData.path);
        imageUrl = publicUrl.publicUrl;
      }
    }

    // Generate token address
    const tokenAddress = generateTokenAddress();

    // Deduct creation cost from wallet
    const { error: deductError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: wallet.balance - TOKEN_CREATION_COST,
        transaction_count: (wallet as any).transaction_count + 1,
        total_sent: ((wallet as any).total_sent || 0) + TOKEN_CREATION_COST,
      })
      .eq("pubkey", creatorPubkey);

    if (deductError) {
      console.error("Deduct error:", deductError);
      return NextResponse.json(
        { success: false, error: "Failed to deduct creation fee" },
        { status: 500 }
      );
    }

    // Virtual pool (pump.fun style bonding curve)
    // Initial: 4000 USDK + 1B tokens (virtual liquidity - no real tokens deposited)
    // Initial price = 4000/1B = 0.000004 USDK per token
    // Initial market cap = 1B tokens * 0.000004 = $4,000
    // Graduation at $69K market cap (like pump.fun)
    const INITIAL_VIRTUAL_USDK = 4000;
    const INITIAL_VIRTUAL_TOKEN = 1000000000000000; // 1B with 6 decimals
    const INITIAL_PRICE = INITIAL_VIRTUAL_USDK / (INITIAL_VIRTUAL_TOKEN / 1_000_000);
    const TOTAL_SUPPLY = 1000000000000000; // 1B with 6 decimals
    const INITIAL_MARKET_CAP = (TOTAL_SUPPLY / 1_000_000) * INITIAL_PRICE; // $4,000

    // Create token with virtual pool
    const { data: token, error: tokenError } = await supabaseAdmin
      .from("memecoins")
      .insert({
        address: tokenAddress,
        name,
        symbol: symbol.toUpperCase(),
        description,
        image_url: imageUrl,
        twitter_url: twitterUrl || null,
        website_url: websiteUrl || null,
        telegram_url: telegramUrl || null,
        creator_pubkey: creatorPubkey,
        total_supply: TOTAL_SUPPLY,
        circulating_supply: 0,
        price: INITIAL_PRICE,
        market_cap: INITIAL_MARKET_CAP,
        volume_24h: 0,
        virtual_usdk_reserve: INITIAL_VIRTUAL_USDK,
        virtual_token_reserve: INITIAL_VIRTUAL_TOKEN,
        is_graduated: false,
        graduation_threshold: 69000, // $69K market cap for graduation
        total_usdk_raised: 0,
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      // Rollback wallet balance
      await supabaseAdmin
        .from("wallets")
        .update({ balance: wallet.balance })
        .eq("pubkey", creatorPubkey);
      return NextResponse.json(
        { success: false, error: "Failed to create token" },
        { status: 500 }
      );
    }

    // Create blockchain transaction record
    const signature = generateSignature();
    const { data: latestBlock } = await supabaseAdmin
      .from("blocks")
      .select("slot")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    await supabaseAdmin.from("transactions").insert({
      signature,
      slot: latestBlock?.slot || null,
      fee: 0,
      status: "confirmed",
      transaction_type: "token_create",
      from_pubkey: creatorPubkey,
      to_pubkey: tokenAddress,
      amount: TOKEN_CREATION_COST * 1_000_000,
      program_id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      instruction_data: {
        type: "token_create",
        memecoin_address: tokenAddress,
        token_name: name,
        token_symbol: symbol.toUpperCase(),
        total_supply: 1000000000,
        creator: creatorPubkey,
      },
      confirmed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Token creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
