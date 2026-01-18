# PumpPortal Integration - Full Mainnet

## Overview

Remplacer le système de tokens simulés par de vrais tokens Pump.fun sur Solana mainnet via PumpPortal API.

**Approche :** Réutiliser les routes existantes, remplacer la logique simulation → mainnet.

---

## Routes (existantes, à modifier)

```
API:
/api/tokens                    → GET: liste nos tokens
/api/tokens/create             → POST: créer via PumpPortal
/api/tokens/[address]          → GET: detail token
/api/tokens/[address]/buy      → POST: acheter
/api/tokens/[address]/sell     → POST: vendre

Pages:
/app/tokens                    → liste tokens
/app/tokens/create             → form création
/app/token/[address]           → detail + trading
```

---

## Database Schema

Remplacer `memecoins` par `pumpfun_tokens` :

```sql
-- Drop old simulated tables (optional, backup first)
-- DROP TABLE IF EXISTS memecoin_trades;
-- DROP TABLE IF EXISTS memecoin_holdings;
-- DROP TABLE IF EXISTS memecoins;

-- Real Pump.fun tokens created via Klodchain
CREATE TABLE pumpfun_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pump.fun identifiers
  mint_address TEXT UNIQUE NOT NULL,
  bonding_curve TEXT,
  associated_bonding_curve TEXT,

  -- Metadata
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Social links
  twitter_url TEXT,
  telegram_url TEXT,
  website_url TEXT,

  -- Creator
  creator_wallet TEXT NOT NULL,

  -- Stats (refreshed from Pump.fun API)
  price_sol DECIMAL,
  market_cap_sol DECIMAL,
  market_cap_usd DECIMAL,
  virtual_sol_reserves DECIMAL,
  virtual_token_reserves DECIMAL,
  total_supply DECIMAL,

  -- Status
  is_graduated BOOLEAN DEFAULT false,
  raydium_pool TEXT,

  -- TX
  creation_signature TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade history (for analytics)
CREATE TABLE pumpfun_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_mint TEXT REFERENCES pumpfun_tokens(mint_address) ON DELETE CASCADE,
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
CREATE INDEX idx_pumpfun_tokens_market_cap ON pumpfun_tokens(market_cap_sol DESC);
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
├── lib/
│   └── pumpportal/
│       ├── client.ts           # PumpPortal API client
│       └── types.ts            # Types
│
├── app/
│   ├── api/
│   │   └── tokens/
│   │       ├── route.ts                    # GET list (modifier)
│   │       ├── create/route.ts             # POST create (modifier)
│   │       └── [address]/
│   │           ├── route.ts                # GET detail (modifier)
│   │           ├── buy/route.ts            # POST buy (modifier)
│   │           └── sell/route.ts           # POST sell (modifier)
│   │
│   └── app/
│       ├── tokens/
│       │   ├── page.tsx                    # Liste (modifier)
│       │   └── create/page.tsx             # Form (modifier)
│       └── token/
│           └── [address]/page.tsx          # Detail (modifier)
│
├── components/
│   ├── wallet/
│   │   └── SolanaWalletProvider.tsx        # Nouveau
│   └── tokens/
│       └── TradingPanel.tsx                # Modifier pour mainnet
│
└── providers/
    └── wallet-provider.tsx                 # Nouveau
```

---

## Dependencies

```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets bs58
```

---

## PumpPortal Client

```typescript
// src/lib/pumpportal/client.ts

const PUMPPORTAL_API = 'https://pumpportal.fun/api';
const PUMPFUN_API = 'https://frontend-api.pump.fun';

export class PumpPortalClient {

  // Upload metadata to IPFS
  async uploadMetadata(data: {
    file: File;
    name: string;
    symbol: string;
    description: string;
    twitter?: string;
    telegram?: string;
    website?: string;
  }): Promise<string> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name);
    formData.append('symbol', data.symbol);
    formData.append('description', data.description);
    if (data.twitter) formData.append('twitter', data.twitter);
    if (data.telegram) formData.append('telegram', data.telegram);
    if (data.website) formData.append('website', data.website);
    formData.append('showName', 'true');

    const response = await fetch(`${PUMPPORTAL_API}/ipfs`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('IPFS upload failed');
    const { metadataUri } = await response.json();
    return metadataUri;
  }

  // Get create token transaction
  async getCreateTransaction(params: {
    creatorPubkey: string;
    name: string;
    symbol: string;
    metadataUri: string;
    mintPubkey: string;
    initialBuySOL?: number;
  }): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: params.creatorPubkey,
        action: 'create',
        tokenMetadata: {
          name: params.name,
          symbol: params.symbol,
          uri: params.metadataUri
        },
        mint: params.mintPubkey,
        denominatedInSol: 'true',
        amount: params.initialBuySOL || 0,
        slippage: 10,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return response.text(); // Base64 transaction
  }

  // Get buy transaction
  async getBuyTransaction(params: {
    buyerPubkey: string;
    mint: string;
    solAmount: number;
    slippageBps?: number;
  }): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: params.buyerPubkey,
        action: 'buy',
        mint: params.mint,
        amount: params.solAmount,
        denominatedInSol: 'true',
        slippage: (params.slippageBps || 500) / 100,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (!response.ok) throw new Error('Failed to get buy transaction');
    return response.text();
  }

  // Get sell transaction
  async getSellTransaction(params: {
    sellerPubkey: string;
    mint: string;
    tokenAmount: number;
    slippageBps?: number;
  }): Promise<string> {
    const response = await fetch(`${PUMPPORTAL_API}/trade-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: params.sellerPubkey,
        action: 'sell',
        mint: params.mint,
        amount: params.tokenAmount,
        denominatedInSol: 'false',
        slippage: (params.slippageBps || 500) / 100,
        priorityFee: 0.0005,
        pool: 'pump'
      })
    });

    if (!response.ok) throw new Error('Failed to get sell transaction');
    return response.text();
  }

  // Fetch token info from Pump.fun
  async getTokenInfo(mint: string): Promise<PumpfunTokenInfo> {
    const response = await fetch(`${PUMPFUN_API}/coins/${mint}`);
    if (!response.ok) throw new Error('Token not found');
    return response.json();
  }
}

export const pumpPortal = new PumpPortalClient();
```

---

## Implementation Steps

### Phase 1: Setup Wallet
- [ ] `npm install` wallet adapter packages
- [ ] Create `SolanaWalletProvider` component
- [ ] Add to root layout
- [ ] Add wallet connect button to header
- [ ] Test wallet connection

### Phase 2: Database
- [ ] Create migration for `pumpfun_tokens` and `pumpfun_trades`
- [ ] Run migration on Supabase
- [ ] Update TypeScript types

### Phase 3: PumpPortal Client
- [ ] Create `src/lib/pumpportal/client.ts`
- [ ] Create `src/lib/pumpportal/types.ts`
- [ ] Test IPFS upload
- [ ] Test transaction generation

### Phase 4: Token Creation
- [ ] Modify `/api/tokens/create` → PumpPortal
- [ ] Modify `/app/tokens/create` form
- [ ] Handle transaction signing flow
- [ ] Store created token in DB

### Phase 5: Token List & Detail
- [ ] Modify `/api/tokens` → fetch from `pumpfun_tokens`
- [ ] Modify `/app/tokens` list page
- [ ] Modify `/api/tokens/[address]` → fetch + refresh from Pump.fun API
- [ ] Modify `/app/token/[address]` detail page

### Phase 6: Trading
- [ ] Modify `/api/tokens/[address]/buy`
- [ ] Modify `/api/tokens/[address]/sell`
- [ ] Update trading panel UI
- [ ] Handle transaction signing
- [ ] Store trades in DB

### Phase 7: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Refresh token stats periodically
- [ ] External links to Pump.fun

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

## Notes

- Tous les tokens créés via Klodchain sont de vrais tokens sur Pump.fun
- Les users doivent avoir un wallet Solana (Phantom, Solflare, etc.)
- Les users doivent avoir du SOL pour les frais (~0.02 SOL pour créer, gas pour trades)
- PumpPortal prend 0.5% sur chaque trade
- On peut potentiellement ajouter notre propre fee plus tard
