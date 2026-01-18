# PumpPortal Integration - Token Launch Platform

## Overview

Intégrer PumpPortal pour permettre aux utilisateurs de Klodchain de créer de **vrais tokens Pump.fun** sur Solana mainnet. Klodchain devient une plateforme de lancement de memecoins.

**Scope :**
- Création de tokens réels via PumpPortal API
- Affichage uniquement des tokens créés via Klodchain
- Trading de ces tokens (buy/sell)
- Pas d'import des tokens externes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      KLODCHAIN                              │
│                                                             │
│  ┌─────────────────┐      ┌─────────────────────────────┐  │
│  │  Token Creation │      │     Token Display           │  │
│  │                 │      │                             │  │
│  │  Form UI ───────┼──────┼──► Supabase (our tokens)    │  │
│  │       │         │      │          │                  │  │
│  │       ▼         │      │          ▼                  │  │
│  │  PumpPortal API │      │   Trading Panel             │  │
│  │       │         │      │          │                  │  │
│  │       ▼         │      │          ▼                  │  │
│  │  Solana Mainnet │      │   PumpPortal Trade API      │  │
│  └─────────────────┘      └─────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Tokens créés via Klodchain sur Pump.fun
CREATE TABLE pumpfun_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pump.fun data
  mint_address TEXT UNIQUE NOT NULL,
  bonding_curve TEXT,
  associated_bonding_curve TEXT,

  -- Token metadata
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Social links
  twitter_url TEXT,
  telegram_url TEXT,
  website_url TEXT,

  -- Creator info
  creator_wallet TEXT NOT NULL,
  creator_klod_wallet TEXT REFERENCES wallets(pubkey),

  -- Stats (updated periodically)
  market_cap_sol DECIMAL,
  market_cap_usd DECIMAL,
  price_sol DECIMAL,
  virtual_sol_reserves DECIMAL,
  virtual_token_reserves DECIMAL,
  is_graduated BOOLEAN DEFAULT false,

  -- Metadata
  creation_tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades on our tokens (for history/analytics)
CREATE TABLE pumpfun_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_mint TEXT REFERENCES pumpfun_tokens(mint_address),
  trader_wallet TEXT NOT NULL,
  trade_type TEXT CHECK (trade_type IN ('buy', 'sell')),
  sol_amount DECIMAL NOT NULL,
  token_amount DECIMAL NOT NULL,
  price_per_token DECIMAL,
  tx_signature TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pumpfun_tokens_creator ON pumpfun_tokens(creator_wallet);
CREATE INDEX idx_pumpfun_tokens_created ON pumpfun_tokens(created_at DESC);
CREATE INDEX idx_pumpfun_trades_token ON pumpfun_trades(token_mint);
CREATE INDEX idx_pumpfun_trades_trader ON pumpfun_trades(trader_wallet);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pumpfun_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE pumpfun_trades;
```

---

## Project Structure

```
src/
├── app/
│   ├── real/
│   │   ├── page.tsx                    # Liste des tokens Klodchain
│   │   ├── create/page.tsx             # Créer un token
│   │   └── token/[mint]/page.tsx       # Detail + trading
│   │
│   └── api/
│       └── real/
│           ├── tokens/
│           │   ├── route.ts            # GET: liste nos tokens
│           │   ├── create/route.ts     # POST: créer token via PumpPortal
│           │   └── [mint]/
│           │       ├── route.ts        # GET: detail token
│           │       └── refresh/route.ts # POST: refresh stats from chain
│           │
│           └── trade/
│               ├── buy/route.ts        # POST: acheter
│               └── sell/route.ts       # POST: vendre
│
├── components/
│   └── real/
│       ├── PumpfunTokenCard.tsx        # Card token
│       ├── PumpfunTokenList.tsx        # Liste tokens
│       ├── CreateTokenForm.tsx         # Form création
│       ├── TradingPanel.tsx            # Buy/Sell UI
│       └── TokenStats.tsx              # Stats display
│
├── lib/
│   └── pumpportal/
│       ├── client.ts                   # API client
│       ├── types.ts                    # Types
│       └── ipfs.ts                     # Upload metadata
│
└── hooks/
    ├── usePumpfunTokens.ts             # Fetch nos tokens
    └── usePumpfunTrade.ts              # Trading hook
```

---

## PumpPortal API Client

```typescript
// src/lib/pumpportal/client.ts

const PUMPPORTAL_API = 'https://pumpportal.fun/api';

export interface CreateTokenRequest {
  name: string;
  symbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  file: File;              // Token image
  showName?: boolean;
}

export interface CreateTokenWithBuyRequest extends CreateTokenRequest {
  initialBuyAmount: number; // SOL to buy on creation
}

export class PumpPortalClient {

  /**
   * Create token - returns unsigned transaction
   * User must sign with their wallet
   */
  async createToken(
    creatorPubkey: string,
    metadata: CreateTokenRequest,
    mintKeypair: Keypair
  ): Promise<{ transaction: string; mint: string }> {

    // 1. Upload metadata to IPFS via PumpPortal
    const formData = new FormData();
    formData.append('file', metadata.file);
    formData.append('name', metadata.name);
    formData.append('symbol', metadata.symbol);
    formData.append('description', metadata.description);
    if (metadata.twitter) formData.append('twitter', metadata.twitter);
    if (metadata.telegram) formData.append('telegram', metadata.telegram);
    if (metadata.website) formData.append('website', metadata.website);
    formData.append('showName', 'true');

    const ipfsResponse = await fetch(`${PUMPPORTAL_API}/ipfs`, {
      method: 'POST',
      body: formData
    });

    if (!ipfsResponse.ok) {
      throw new Error('Failed to upload metadata to IPFS');
    }

    const { metadataUri } = await ipfsResponse.json();

    // 2. Get create transaction
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: creatorPubkey,
        action: 'create',
        tokenMetadata: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadataUri
        },
        mint: mintKeypair.publicKey.toBase58(),
        denominatedInSol: 'true',
        amount: 0, // No initial buy
        slippage: 10,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Create token failed: ${error}`);
    }

    return {
      transaction: await response.text(), // Base64 encoded
      mint: mintKeypair.publicKey.toBase58()
    };
  }

  /**
   * Create token with initial buy
   */
  async createTokenWithBuy(
    creatorPubkey: string,
    metadata: CreateTokenWithBuyRequest,
    mintKeypair: Keypair
  ): Promise<{ transaction: string; mint: string }> {
    // Same as above but with amount > 0
    // ...
  }

  /**
   * Buy tokens
   */
  async getBuyTransaction(
    buyerPubkey: string,
    mint: string,
    solAmount: number,
    slippageBps: number = 500
  ): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: buyerPubkey,
        action: 'buy',
        mint,
        amount: solAmount,
        denominatedInSol: 'true',
        slippage: slippageBps / 100,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get buy transaction');
    }

    return response.text();
  }

  /**
   * Sell tokens
   */
  async getSellTransaction(
    sellerPubkey: string,
    mint: string,
    tokenAmount: number, // In token units (not lamports)
    slippageBps: number = 500
  ): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: sellerPubkey,
        action: 'sell',
        mint,
        amount: tokenAmount,
        denominatedInSol: 'false',
        slippage: slippageBps / 100,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get sell transaction');
    }

    return response.text();
  }

  /**
   * Get token info from Pump.fun
   */
  async getTokenInfo(mint: string): Promise<PumpfunTokenInfo> {
    const response = await fetch(
      `https://frontend-api.pump.fun/coins/${mint}`
    );

    if (!response.ok) {
      throw new Error('Token not found');
    }

    return response.json();
  }
}

export const pumpPortal = new PumpPortalClient();
```

---

## API Routes

### Create Token (`/api/real/tokens/create/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { createClient } from '@/lib/supabase/server';
import { pumpPortal } from '@/lib/pumpportal/client';
import bs58 from 'bs58';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const creatorWallet = formData.get('creatorWallet') as string;
    const klodWallet = formData.get('klodWallet') as string | null;
    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const description = formData.get('description') as string;
    const image = formData.get('image') as File;
    const twitter = formData.get('twitter') as string | null;
    const telegram = formData.get('telegram') as string | null;
    const website = formData.get('website') as string | null;

    // Validate
    if (!creatorWallet || !name || !symbol || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate mint keypair
    const mintKeypair = Keypair.generate();

    // Get create transaction from PumpPortal
    const { transaction, mint } = await pumpPortal.createToken(
      creatorWallet,
      { name, symbol, description, file: image, twitter, telegram, website },
      mintKeypair
    );

    // Store pending token in DB
    const supabase = await createClient();
    await supabase.from('pumpfun_tokens').insert({
      mint_address: mint,
      name,
      symbol,
      description,
      twitter_url: twitter,
      telegram_url: telegram,
      website_url: website,
      creator_wallet: creatorWallet,
      creator_klod_wallet: klodWallet
    });

    return NextResponse.json({
      transaction,       // Base64 - client must sign
      mint,
      mintSecretKey: bs58.encode(mintKeypair.secretKey) // Client needs this to co-sign
    });

  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    );
  }
}
```

### List Our Tokens (`/api/real/tokens/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  const { data: tokens, error, count } = await supabase
    .from('pumpfun_tokens')
    .select('*', { count: 'exact' })
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tokens,
    total: count,
    hasMore: (count || 0) > offset + limit
  });
}
```

### Buy Token (`/api/real/trade/buy/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pumpPortal } from '@/lib/pumpportal/client';

export async function POST(request: NextRequest) {
  try {
    const { walletPubkey, mint, solAmount, slippageBps = 500 } = await request.json();

    // Verify token is one of ours
    const supabase = await createClient();
    const { data: token } = await supabase
      .from('pumpfun_tokens')
      .select('mint_address')
      .eq('mint_address', mint)
      .single();

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found in Klodchain' },
        { status: 404 }
      );
    }

    // Get buy transaction
    const transaction = await pumpPortal.getBuyTransaction(
      walletPubkey,
      mint,
      solAmount,
      slippageBps
    );

    return NextResponse.json({ transaction });

  } catch (error: any) {
    console.error('Buy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create buy transaction' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Components

### Create Token Form (`/app/real/create/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Keypair, VersionedTransaction } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import bs58 from 'bs58';

export default function CreateTokenPage() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    description: '',
    twitter: '',
    telegram: '',
    website: ''
  });
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey || !signTransaction) {
      toast.error('Connect your wallet first');
      return;
    }

    if (!image) {
      toast.error('Please upload an image');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Get transaction from API
      const formData = new FormData();
      formData.append('creatorWallet', publicKey.toBase58());
      formData.append('name', form.name);
      formData.append('symbol', form.symbol.toUpperCase());
      formData.append('description', form.description);
      formData.append('image', image);
      if (form.twitter) formData.append('twitter', form.twitter);
      if (form.telegram) formData.append('telegram', form.telegram);
      if (form.website) formData.append('website', form.website);

      const response = await fetch('/api/real/tokens/create', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const { transaction: txBase64, mint, mintSecretKey } = await response.json();

      // 2. Deserialize transaction
      const txBuffer = Buffer.from(txBase64, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);

      // 3. Sign with mint keypair (required by Pump.fun)
      const mintKeypair = Keypair.fromSecretKey(bs58.decode(mintSecretKey));
      transaction.sign([mintKeypair]);

      // 4. Sign with user wallet
      const signedTx = await signTransaction(transaction);

      // 5. Send transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.info('Transaction sent, confirming...');

      // 6. Confirm
      await connection.confirmTransaction(signature, 'confirmed');

      // 7. Update DB with confirmation
      await fetch(`/api/real/tokens/${mint}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature })
      });

      toast.success('Token created!', {
        description: `${form.name} ($${form.symbol}) is now live on Pump.fun`
      });

      router.push(`/real/token/${mint}`);

    } catch (error: any) {
      console.error('Create error:', error);
      toast.error(error.message || 'Failed to create token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Launch Token on Pump.fun</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a real memecoin on Solana mainnet
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image upload */}
            <div>
              <Label>Token Image *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* Name & Symbol */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="Doge Coin"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={32}
                  required
                />
              </div>
              <div>
                <Label>Symbol *</Label>
                <Input
                  placeholder="DOGE"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="The next 1000x memecoin..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Social links */}
            <div className="space-y-4">
              <Label>Social Links (optional)</Label>
              <Input
                placeholder="https://twitter.com/..."
                value={form.twitter}
                onChange={(e) => setForm({ ...form, twitter: e.target.value })}
              />
              <Input
                placeholder="https://t.me/..."
                value={form.telegram}
                onChange={(e) => setForm({ ...form, telegram: e.target.value })}
              />
              <Input
                placeholder="https://..."
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-orange-800">Real Transaction</p>
              <p className="text-orange-700">
                This will create a real token on Solana mainnet via Pump.fun.
                You'll need SOL for transaction fees (~0.02 SOL).
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !publicKey}
            >
              {isLoading ? 'Creating...' : 'Create Token'}
            </Button>

            {!publicKey && (
              <p className="text-center text-sm text-muted-foreground">
                Connect your Solana wallet to create a token
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Token List Page (`/app/real/page.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PumpfunToken {
  mint_address: string;
  name: string;
  symbol: string;
  description: string;
  image_url: string;
  market_cap_sol: number;
  price_sol: number;
  is_graduated: boolean;
  created_at: string;
}

export default function RealTokensPage() {
  const [tokens, setTokens] = useState<PumpfunToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/real/tokens')
      .then(res => res.json())
      .then(data => {
        setTokens(data.tokens || []);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Klodchain Tokens</h1>
          <p className="text-muted-foreground">
            Real tokens launched via Klodchain on Pump.fun
          </p>
        </div>
        <Link href="/real/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Launch Token
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No tokens launched yet. Be the first!
          </p>
          <Link href="/real/create">
            <Button>Launch Token</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map(token => (
            <Link key={token.mint_address} href={`/real/token/${token.mint_address}`}>
              <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-start gap-4">
                  {token.image_url && (
                    <Image
                      src={token.image_url}
                      alt={token.name}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{token.name}</h3>
                      {token.is_graduated && (
                        <Badge variant="secondary">Graduated</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">${token.symbol}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Market Cap</p>
                    <p className="font-mono">
                      {token.market_cap_sol?.toFixed(2) || '0'} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-mono">
                      {token.price_sol?.toFixed(8) || '0'} SOL
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(token.created_at).toLocaleDateString()}</span>
                  <a
                    href={`https://pump.fun/${token.mint_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Pump.fun <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Steps

### Phase 1: Setup
- [ ] Install `@solana/wallet-adapter-*` packages
- [ ] Create `SolanaWalletProvider`
- [ ] Add wallet connect button to header
- [ ] Run database migration
- [ ] Create `/real` route structure

### Phase 2: Token Creation
- [ ] Create `pumpportal/client.ts`
- [ ] Implement `/api/real/tokens/create` endpoint
- [ ] Build token creation form UI
- [ ] Handle transaction signing flow
- [ ] Store created tokens in Supabase

### Phase 3: Token Display
- [ ] Create `/api/real/tokens` endpoint
- [ ] Build token list page `/real`
- [ ] Build token detail page `/real/token/[mint]`
- [ ] Fetch/refresh stats from Pump.fun API

### Phase 4: Trading
- [ ] Implement buy/sell API endpoints
- [ ] Build trading panel component
- [ ] Add slippage settings
- [ ] Store trade history

### Phase 5: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsive
- [ ] Link simulation ↔ real modes

---

## Environment Variables

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# New
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## Cost Structure

| Item | Cost |
|------|------|
| Token creation | ~0.02 SOL (tx fees) |
| Trade execution | 0.5% (PumpPortal fee) |
| Supabase | Free tier / $25 |
| RPC | Free tier sufficient |

---

## Notes

- Tokens créés via Klodchain sont de vrais tokens Pump.fun
- N'importe qui peut les trader sur pump.fun directement
- On affiche uniquement les tokens créés via notre plateforme
- Possibilité future: prendre une fee sur les créations
