import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const mint = searchParams.get("mint");

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  if (!mint) {
    return NextResponse.json(
      { error: "Token mint address required" },
      { status: 400 }
    );
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

  try {
    // Get token accounts for this wallet and specific mint
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint: mint },
          { encoding: "jsonParsed" }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("RPC error:", data.error);
      return NextResponse.json(
        { error: data.error.message || "RPC error" },
        { status: 500 }
      );
    }

    let balance = 0;
    let decimals = 6; // Default for pump.fun tokens
    let tokenAccount = null;

    if (data.result?.value?.length > 0) {
      tokenAccount = data.result.value[0];
      const tokenInfo = tokenAccount.account.data.parsed.info;
      balance = tokenInfo.tokenAmount.uiAmount || 0;
      decimals = tokenInfo.tokenAmount.decimals || 6;
    }

    return NextResponse.json({
      success: true,
      balance: balance,
      decimals: decimals,
      mint: mint,
      tokenAccount: tokenAccount?.pubkey || null,
      rawAmount: tokenAccount?.account.data.parsed.info.tokenAmount.amount || "0",
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
