"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Code, Copy, Check, Zap, Shield, Database, ExternalLink } from "lucide-react";

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; description: string; required?: boolean }[];
  queryParams?: { name: string; type: string; description: string; default?: string }[];
  response: string;
}

const endpoints: Endpoint[] = [
  // Blocks
  {
    method: "GET",
    path: "/api/v1/blocks",
    description: "Get a list of blocks with pagination",
    queryParams: [
      { name: "limit", type: "number", description: "Number of blocks to return (max 100)", default: "20" },
      { name: "offset", type: "number", description: "Number of blocks to skip", default: "0" },
      { name: "order", type: "string", description: "Sort order: 'asc' or 'desc'", default: "desc" },
    ],
    response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slot": 12345,
      "blockhash": "abc123...",
      "leader_pubkey": "validator1",
      "transaction_count": 50,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/blocks/:slot",
    description: "Get a specific block by slot number, including its transactions",
    params: [{ name: "slot", type: "number", description: "Block slot number", required: true }],
    response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "slot": 12345,
    "blockhash": "abc123...",
    "previous_blockhash": "xyz789...",
    "leader_pubkey": "validator1",
    "transaction_count": 3,
    "timestamp": "2024-01-15T10:30:00Z",
    "transactions": [
      {
        "signature": "sig123...",
        "transaction_type": "transfer",
        "from_pubkey": "klod_abc",
        "to_pubkey": "klod_xyz",
        "amount": 100000000,
        "fee": 5000,
        "status": "confirmed"
      }
    ]
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/transactions",
    description: "Get a list of transactions with filtering and pagination",
    queryParams: [
      { name: "limit", type: "number", description: "Number of transactions to return (max 100)", default: "20" },
      { name: "offset", type: "number", description: "Number of transactions to skip", default: "0" },
      { name: "type", type: "string", description: "Filter by transaction type (transfer, token_transfer, faucet_claim, etc.)" },
      { name: "status", type: "string", description: "Filter by status (pending, confirmed, failed)" },
      { name: "from", type: "string", description: "Filter by sender pubkey" },
      { name: "to", type: "string", description: "Filter by recipient pubkey" },
    ],
    response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "signature": "sig123...",
      "slot": 12345,
      "transaction_type": "transfer",
      "from_pubkey": "klod_abc",
      "to_pubkey": "klod_xyz",
      "amount": 100000000,
      "fee": 5000,
      "status": "confirmed",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5000,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/transactions/:signature",
    description: "Get a specific transaction by its signature",
    params: [{ name: "signature", type: "string", description: "Transaction signature", required: true }],
    response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "signature": "sig123...",
    "slot": 12345,
    "block_index": 0,
    "transaction_type": "token_transfer",
    "from_pubkey": "klod_abc",
    "to_pubkey": "klod_xyz",
    "amount": 100000000,
    "fee": 0,
    "status": "confirmed",
    "program_id": "11111111111111111111111111111111",
    "instruction_data": {
      "type": "token_transfer",
      "amount": 100,
      "sender": "klod_abc",
      "recipient": "klod_xyz"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "confirmed_at": "2024-01-15T10:30:01Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/accounts/:pubkey",
    description: "Get account information by public key (supports both wallets and blockchain accounts)",
    params: [{ name: "pubkey", type: "string", description: "Account public key", required: true }],
    queryParams: [
      { name: "transactions", type: "boolean", description: "Include recent transactions", default: "false" },
    ],
    response: `{
  "success": true,
  "data": {
    "pubkey": "klod_abc123...",
    "type": "wallet",
    "balance": 1000,
    "transactionCount": 15,
    "totalSent": 500,
    "totalReceived": 1500,
    "createdAt": "2024-01-10T08:00:00Z",
    "recentTransactions": [...]
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/stats",
    description: "Get network statistics and overview",
    response: `{
  "success": true,
  "data": {
    "network": {
      "name": "Klodchain",
      "version": "1.0.0",
      "cluster": "devnet"
    },
    "currentSlot": 12345,
    "latestBlockhash": "abc123...",
    "blockTime": "2024-01-15T10:30:00Z",
    "stats": {
      "totalBlocks": 12345,
      "totalTransactions": 50000,
      "totalWallets": 150,
      "activeValidators": 5,
      "currentTps": 2.5
    },
    "transactionTypes": {
      "transfer": 45000,
      "token_transfer": 3000,
      "faucet_claim": 500,
      "program_call": 1500
    },
    "validators": [...]
  }
}`,
  },
  // Tokens (Memecoins)
  {
    method: "GET",
    path: "/api/v1/tokens",
    description: "Get a list of memecoins with pagination, search, and sorting",
    queryParams: [
      { name: "limit", type: "number", description: "Number of tokens to return (max 100)", default: "20" },
      { name: "offset", type: "number", description: "Number of tokens to skip", default: "0" },
      { name: "sort", type: "string", description: "Sort by: 'created_at', 'market_cap', 'volume', 'price'", default: "created_at" },
      { name: "order", type: "string", description: "Sort order: 'asc' or 'desc'", default: "desc" },
      { name: "search", type: "string", description: "Search by name, symbol, or address" },
    ],
    response: `{
  "success": true,
  "data": [
    {
      "address": "dogeklod",
      "name": "Doge Klod",
      "symbol": "DOGE",
      "description": "The original meme coin on Klodchain",
      "image_url": "https://...",
      "creator_pubkey": "klod_abc123...",
      "total_supply": 1000000000000000,
      "circulating_supply": 200000000000000,
      "price": 0.000001,
      "market_cap": 200,
      "volume_24h": 50.5,
      "reserve_klod": 4000,
      "reserve_token": 800000000000000,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/tokens/:address",
    description: "Get detailed information about a specific token including holder count and recent trades",
    params: [{ name: "address", type: "string", description: "Token address (ends with 'klod')", required: true }],
    response: `{
  "success": true,
  "data": {
    "address": "dogeklod",
    "name": "Doge Klod",
    "symbol": "DOGE",
    "description": "The original meme coin on Klodchain",
    "image_url": "https://...",
    "twitter_url": "https://twitter.com/...",
    "website_url": "https://...",
    "telegram_url": "https://t.me/...",
    "creator_pubkey": "klod_abc123...",
    "total_supply": 1000000000000000,
    "circulating_supply": 200000000000000,
    "price": 0.000001,
    "market_cap": 200,
    "volume_24h": 50.5,
    "reserve_klod": 4000,
    "reserve_token": 800000000000000,
    "holder_count": 42,
    "recent_trades": [
      {
        "id": "uuid",
        "trader_pubkey": "klod_xyz...",
        "trade_type": "buy",
        "klod_amount": 100000000,
        "token_amount": 50000000000,
        "price_per_token": 0.000002,
        "signature": "sig123...",
        "created_at": "2024-01-15T11:00:00Z"
      }
    ],
    "volume_24h_calculated": 50.5,
    "created_at": "2024-01-15T10:30:00Z"
  }
}`,
  },
];

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="p-4 rounded-lg bg-zinc-900 text-zinc-100 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge variant={endpoint.method === "GET" ? "default" : "secondary"} className="font-mono">
            {endpoint.method}
          </Badge>
          <code className="text-lg font-semibold">{endpoint.path}</code>
        </div>
        <CardDescription className="mt-2">{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Path Parameters</h4>
            <div className="space-y-2">
              {endpoint.params.map((param) => (
                <div key={param.name} className="flex items-start gap-2 text-sm">
                  <code className="px-2 py-0.5 bg-muted rounded font-mono">{param.name}</code>
                  <span className="text-muted-foreground">({param.type})</span>
                  {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  <span className="text-muted-foreground">- {param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Query Parameters</h4>
            <div className="space-y-2">
              {endpoint.queryParams.map((param) => (
                <div key={param.name} className="flex items-start gap-2 text-sm flex-wrap">
                  <code className="px-2 py-0.5 bg-muted rounded font-mono">{param.name}</code>
                  <span className="text-muted-foreground">({param.type})</span>
                  {param.default && (
                    <span className="text-xs text-muted-foreground">default: {param.default}</span>
                  )}
                  <span className="text-muted-foreground">- {param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold mb-2">Response</h4>
          <CodeBlock code={endpoint.response} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApiDocsPage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://klodchain.vercel.app";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>API Documentation</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Code className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Klodchain API</h1>
            <p className="text-muted-foreground">Public REST API for blockchain data</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold">Fast & Free</h3>
                <p className="text-sm text-muted-foreground">No API key required</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Rate Limited</h3>
                <p className="text-sm text-muted-foreground">10 requests/minute per IP</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Real-time Data</h3>
                <p className="text-sm text-muted-foreground">Live blockchain data</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock code={`${baseUrl}/api/v1`} language="text" />
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All API endpoints are rate limited to <strong>10 requests per minute</strong> per IP address.
          </p>
          <p className="text-sm text-muted-foreground">Rate limit information is included in response headers:</p>
          <CodeBlock
            code={`X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1705312200000`}
            language="text"
          />
          <p className="text-sm text-muted-foreground">
            When rate limited, you&apos;ll receive a <code className="px-1 py-0.5 bg-muted rounded">429 Too Many Requests</code> response.
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Endpoints</h2>

        <Tabs defaultValue="blocks" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="blocks">Blocks</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="mt-4">
            <EndpointCard endpoint={endpoints[0]} />
            <EndpointCard endpoint={endpoints[1]} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <EndpointCard endpoint={endpoints[2]} />
            <EndpointCard endpoint={endpoints[3]} />
          </TabsContent>

          <TabsContent value="accounts" className="mt-4">
            <EndpointCard endpoint={endpoints[4]} />
          </TabsContent>

          <TabsContent value="tokens" className="mt-4">
            <EndpointCard endpoint={endpoints[6]} />
            <EndpointCard endpoint={endpoints[7]} />
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <EndpointCard endpoint={endpoints[5]} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Fetch the latest 5 blocks using curl:</p>
          <CodeBlock code={`curl "${baseUrl}/api/v1/blocks?limit=5"`} language="bash" />
          <p className="text-sm text-muted-foreground">Or using JavaScript:</p>
          <CodeBlock
            code={`const response = await fetch("${baseUrl}/api/v1/blocks?limit=5");
const data = await response.json();
console.log(data);`}
            language="javascript"
          />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-8">
        <p>Built with Next.js & Supabase</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/explorer" className="text-primary hover:underline flex items-center gap-1">
            Explorer <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/stats" className="text-primary hover:underline flex items-center gap-1">
            Stats <ExternalLink className="h-3 w-3" />
          </Link>
          <Link href="/wallet" className="text-primary hover:underline flex items-center gap-1">
            Wallet <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
