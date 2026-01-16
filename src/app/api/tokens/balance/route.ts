import { NextResponse } from "next/server";

const KLOD_MINT = "8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump";
const KLOD_DECIMALS = 6;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

  try {
    // Get all token accounts for this wallet
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint: KLOD_MINT },
          { encoding: "jsonParsed" }
        ]
      })
    });

    const data = await response.json();

    let balance = 0;
    if (data.result?.value?.length > 0) {
      const tokenAccount = data.result.value[0];
      balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0;
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
