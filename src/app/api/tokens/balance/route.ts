import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const KLOD_MINT = "8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump";
const KLOD_DECIMALS = 6; // pump.fun tokens use 6 decimals

// Use Solana mainnet RPC
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Get Associated Token Address
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL") // Associated Token Program
  );
  return address;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  try {
    const walletPubkey = new PublicKey(wallet);
    const mintPubkey = new PublicKey(KLOD_MINT);

    // Get the associated token account address
    const tokenAccount = getAssociatedTokenAddress(mintPubkey, walletPubkey);

    // Fetch the token account balance
    let balance = 0;
    try {
      const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
      balance = Number(accountInfo.value.uiAmount) || 0;
    } catch (err) {
      // Token account doesn't exist = 0 balance
      console.log("No token account found for wallet:", wallet);
      balance = 0;
    }

    return NextResponse.json({
      success: true,
      balance: {
        balance: balance,
        symbol: "KLOD",
        name: "klodchain",
        decimals: KLOD_DECIMALS,
        mint: KLOD_MINT,
      },
      source: "solana-mainnet",
    });
  } catch (error) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
