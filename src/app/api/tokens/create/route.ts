import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pumpPortal } from "@/lib/pumpportal";

export const dynamic = "force-dynamic";

// Get a vanity keypair from the reserve
async function getVanityKeypair(): Promise<{ publicKey: string; secretKey: string } | null> {
  // Use the SQL function to atomically get and reserve a keypair
  const { data, error } = await supabaseAdmin.rpc("get_next_vanity_keypair", {
    target_suffix: "klod",
  });

  if (error || !data || data.length === 0) {
    console.log("No vanity keypairs available in reserve");
    return null;
  }

  return {
    publicKey: data[0].public_key,
    secretKey: data[0].secret_key,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const symbol = formData.get("symbol") as string;
    const description = formData.get("description") as string | null;
    const twitterUrl = formData.get("twitter_url") as string | null;
    const websiteUrl = formData.get("website_url") as string | null;
    const telegramUrl = formData.get("telegram_url") as string | null;
    const creatorWallet = formData.get("creator_wallet") as string;
    const image = formData.get("image") as File | null;
    const initialBuySol = parseFloat(formData.get("initial_buy_sol") as string) || 0;

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

    if (!creatorWallet) {
      return NextResponse.json(
        { success: false, error: "Creator wallet is required" },
        { status: 400 }
      );
    }

    if (!image || image.size === 0) {
      return NextResponse.json(
        { success: false, error: "Token image is required" },
        { status: 400 }
      );
    }

    // Try to get a vanity keypair from reserve, fallback to random
    let mintPubkey: string;
    let mintSecretKey: string | null = null;

    const vanityKeypair = await getVanityKeypair();
    if (vanityKeypair) {
      mintPubkey = vanityKeypair.publicKey;
      mintSecretKey = vanityKeypair.secretKey;
      console.log(`Using vanity keypair: ${mintPubkey}`);
    } else {
      // Fallback to random keypair (client will generate)
      const randomKeypair = Keypair.generate();
      mintPubkey = randomKeypair.publicKey.toBase58();
      mintSecretKey = Buffer.from(randomKeypair.secretKey).toString("base64");
      console.log(`Using random keypair: ${mintPubkey}`);
    }

    // 1. Upload metadata to IPFS via PumpPortal
    let metadataUri: string;
    try {
      metadataUri = await pumpPortal.uploadMetadata({
        name,
        symbol: symbol.toUpperCase(),
        description: description || "",
        file: image,
        twitter: twitterUrl || undefined,
        telegram: telegramUrl || undefined,
        website: websiteUrl || undefined,
      });
    } catch (error) {
      console.error("IPFS upload error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to upload token metadata" },
        { status: 500 }
      );
    }

    // 3. Get create transaction from PumpPortal
    let transaction: string;
    try {
      transaction = await pumpPortal.getCreateTransaction({
        creatorPubkey: creatorWallet,
        name,
        symbol: symbol.toUpperCase(),
        metadataUri,
        mintPubkey,
        initialBuySOL: initialBuySol,
      });
    } catch (error) {
      console.error("PumpPortal error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create token transaction" },
        { status: 500 }
      );
    }

    // 4. Store pending token in DB (will be confirmed after TX succeeds)
    const { error: insertError } = await supabaseAdmin
      .from("created_tokens")
      .insert({
        mint_address: mintPubkey,
        name,
        symbol: symbol.toUpperCase(),
        description,
        twitter_url: twitterUrl || null,
        telegram_url: telegramUrl || null,
        website_url: websiteUrl || null,
        creator_wallet: creatorWallet,
        // Stats will be populated after confirmation
        price_sol: null,
        market_cap_sol: null,
        market_cap_usd: null,
        is_graduated: false,
      });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save token" },
        { status: 500 }
      );
    }

    // Link vanity keypair to token (if using one from reserve)
    if (vanityKeypair) {
      await supabaseAdmin
        .from("vanity_keypairs")
        .update({ used_by_token: mintPubkey })
        .eq("public_key", mintPubkey);
    }

    // 5. Return transaction for client to sign
    // Include mint keypair so client can sign with it
    return NextResponse.json({
      success: true,
      transaction, // Base64 encoded, client must sign with wallet + mint keypair
      mint: mintPubkey,
      mintSecretKey, // Base64 encoded, client needs this to sign
    });
  } catch (error) {
    console.error("Token creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
