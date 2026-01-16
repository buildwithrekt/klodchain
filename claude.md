# Solana Blockchain Simulator

## Project Overview

Build an automated Solana blockchain simulator with real-time block production, transaction processing, and network visualization. Educational tool to understand Solana's architecture.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Realtime, Edge Functions)
- **State Management**: Zustand or React Context
- **Charts**: Recharts for network stats visualization

## Core Features

### 1. Block Production Engine
- Automated block production every 400ms (configurable speed)
- Slot leader rotation based on validator stake weight
- Proof of History (PoH) simulation - sequential hash chain
- Block contains: slot number, parent hash, transactions[], timestamp, leader

### 2. Transaction System
- Users can submit mock transactions from UI
- Transaction types: Transfer, Create Account, Custom Program Call
- Transaction pool (mempool) with priority fees
- Transaction validation before inclusion in block
- Signature simulation (ed25519 mock)

### 3. Account Model
- Solana-style accounts: pubkey, owner, lamports, data, executable
- System Program for transfers and account creation
- Token-like program for SPL simulation (optional)
- Account state updates on transaction execution

### 4. Validator Network
- Multiple simulated validators with stake amounts
- Leader schedule generation (epoch-based)
- Vote transactions for consensus simulation
- Validator performance metrics (blocks produced, skip rate)

### 5. Real-time Dashboard
- Live block feed with auto-scroll
- Network TPS counter
- Validator leaderboard
- Transaction explorer
- Account balance lookup
- Epoch progress indicator

## Database Schema (Supabase)

```sql
-- Validators table
CREATE TABLE validators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pubkey TEXT UNIQUE NOT NULL,
  name TEXT,
  stake BIGINT DEFAULT 0,
  blocks_produced INTEGER DEFAULT 0,
  skip_rate DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks table
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot BIGINT UNIQUE NOT NULL,
  parent_slot BIGINT,
  blockhash TEXT NOT NULL,
  previous_blockhash TEXT,
  leader_pubkey TEXT NOT NULL REFERENCES validators(pubkey),
  transaction_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  poh_hash TEXT,
  FOREIGN KEY (parent_slot) REFERENCES blocks(slot)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT UNIQUE NOT NULL,
  slot BIGINT REFERENCES blocks(slot),
  block_index INTEGER,
  fee BIGINT DEFAULT 5000,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  transaction_type TEXT NOT NULL, -- transfer, create_account, program_call
  from_pubkey TEXT NOT NULL,
  to_pubkey TEXT,
  amount BIGINT,
  program_id TEXT,
  instruction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Accounts table
CREATE TABLE accounts (
  pubkey TEXT PRIMARY KEY,
  owner TEXT NOT NULL DEFAULT '11111111111111111111111111111111', -- System Program
  lamports BIGINT DEFAULT 0,
  data JSONB DEFAULT '{}',
  executable BOOLEAN DEFAULT false,
  rent_epoch BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Epochs table
CREATE TABLE epochs (
  epoch_number INTEGER PRIMARY KEY,
  start_slot BIGINT NOT NULL,
  end_slot BIGINT NOT NULL,
  leader_schedule JSONB NOT NULL, -- {slot: validator_pubkey}
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Network stats table (for historical metrics)
CREATE TABLE network_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot BIGINT NOT NULL,
  tps DECIMAL,
  active_validators INTEGER,
  total_transactions BIGINT,
  total_accounts INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_blocks_slot ON blocks(slot DESC);
CREATE INDEX idx_transactions_slot ON transactions(slot);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_from ON transactions(from_pubkey);
CREATE INDEX idx_accounts_owner ON accounts(owner);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE network_stats;
```

## Project Structure

```
solana-simulator/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Main dashboard
│   ├── explorer/
│   │   ├── page.tsx                # Block/TX explorer
│   │   ├── block/[slot]/page.tsx   # Block detail
│   │   └── tx/[signature]/page.tsx # Transaction detail
│   ├── accounts/
│   │   └── [pubkey]/page.tsx       # Account detail
│   ├── validators/
│   │   └── page.tsx                # Validator list
│   └── api/
│       ├── simulate/
│       │   └── route.ts            # Manual simulation controls
│       └── transaction/
│           └── route.ts            # Submit transaction
├── components/
│   ├── ui/                         # shadcn components
│   ├── dashboard/
│   │   ├── BlockFeed.tsx           # Real-time block list
│   │   ├── TpsCounter.tsx          # Live TPS display
│   │   ├── NetworkStats.tsx        # Overview cards
│   │   ├── EpochProgress.tsx       # Current epoch progress
│   │   └── ValidatorLeaderboard.tsx
│   ├── explorer/
│   │   ├── BlockCard.tsx
│   │   ├── TransactionTable.tsx
│   │   └── AccountInfo.tsx
│   ├── forms/
│   │   ├── SubmitTransaction.tsx   # Create new TX
│   │   ├── CreateAccount.tsx       # Create new account
│   │   └── AirdropForm.tsx         # Faucet
│   └── simulation/
│       ├── SimulationControls.tsx  # Start/Stop/Speed
│       └── SimulationStatus.tsx    # Current state
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── types.ts                # Generated types
│   ├── simulation/
│   │   ├── engine.ts               # Core simulation logic
│   │   ├── block-producer.ts       # Block creation
│   │   ├── transaction-processor.ts # TX validation & execution
│   │   ├── poh.ts                  # Proof of History hash chain
│   │   ├── leader-schedule.ts      # Validator rotation
│   │   └── accounts.ts             # Account state management
│   ├── crypto/
│   │   ├── hash.ts                 # SHA256 utilities
│   │   └── keypair.ts              # Mock ed25519 keypairs
│   └── utils/
│       ├── constants.ts            # Solana constants
│       └── formatters.ts           # Display helpers
├── hooks/
│   ├── useBlocks.ts                # Real-time blocks subscription
│   ├── useTransactions.ts          # TX subscription
│   ├── useAccount.ts               # Account data
│   ├── useSimulation.ts            # Simulation state
│   └── useNetworkStats.ts          # TPS, validators etc
├── stores/
│   └── simulation-store.ts         # Zustand store for sim state
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── produce-block/          # Edge function for block production
│           └── index.ts
└── types/
    └── index.ts                    # Shared types
```

## Implementation Steps

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript
2. Install and configure shadcn/ui
3. Setup Supabase project and run migrations
4. Create basic layout and navigation
5. Implement Supabase client utilities

### Phase 2: Core Simulation Engine
1. Implement PoH hash chain generator
2. Create block producer logic
3. Build transaction processor with validation
4. Implement account state management
5. Create leader schedule algorithm

### Phase 3: Database Integration
1. Connect simulation engine to Supabase
2. Implement real-time subscriptions
3. Create API routes for manual controls
4. Build transaction submission endpoint

### Phase 4: Dashboard UI
1. Build real-time block feed component
2. Create TPS counter with live updates
3. Implement network stats cards
4. Build validator leaderboard
5. Create epoch progress indicator

### Phase 5: Explorer
1. Build block explorer page
2. Create transaction detail view
3. Implement account lookup
4. Add search functionality

### Phase 6: User Interactions
1. Create transaction submission form
2. Build airdrop/faucet feature
3. Add simulation speed controls
4. Implement start/stop/reset controls

### Phase 7: Polish
1. Add loading states and error handling
2. Implement responsive design
3. Add tooltips and documentation
4. Performance optimization

## Key Implementation Details

### Block Production Logic (lib/simulation/block-producer.ts)

```typescript
interface BlockProductionConfig {
  slotDuration: number; // ms, default 400
  maxTransactionsPerBlock: number; // default 1000
}

async function produceBlock(currentSlot: number): Promise<Block> {
  // 1. Get leader for this slot from schedule
  const leader = await getSlotLeader(currentSlot);
  
  // 2. Fetch pending transactions from pool
  const pendingTxs = await getPendingTransactions(config.maxTransactionsPerBlock);
  
  // 3. Process transactions and update account states
  const processedTxs = await processTransactions(pendingTxs);
  
  // 4. Generate PoH hash
  const pohHash = generatePoH(previousBlock.pohHash, processedTxs);
  
  // 5. Create block hash
  const blockhash = hashBlock(currentSlot, pohHash, processedTxs);
  
  // 6. Save block to database
  const block = await saveBlock({
    slot: currentSlot,
    parentSlot: currentSlot - 1,
    blockhash,
    previousBlockhash: previousBlock.blockhash,
    leaderPubkey: leader.pubkey,
    transactionCount: processedTxs.length,
    pohHash
  });
  
  // 7. Update transaction statuses
  await confirmTransactions(processedTxs, currentSlot);
  
  return block;
}
```

### Real-time Block Feed (components/dashboard/BlockFeed.tsx)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Block } from '@/types';

export function BlockFeed() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchBlocks = async () => {
      const { data } = await supabase
        .from('blocks')
        .select('*')
        .order('slot', { ascending: false })
        .limit(50);
      if (data) setBlocks(data);
    };
    
    fetchBlocks();

    // Real-time subscription
    const channel = supabase
      .channel('blocks')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'blocks' },
        (payload) => {
          setBlocks(prev => [payload.new as Block, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-2">
      {blocks.map(block => (
        <BlockCard key={block.slot} block={block} />
      ))}
    </div>
  );
}
```

### Simulation Engine with Interval (lib/simulation/engine.ts)

```typescript
class SimulationEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private currentSlot: number = 0;
  private config: SimulationConfig;

  async start() {
    if (this.intervalId) return;
    
    // Initialize from DB
    this.currentSlot = await this.getLatestSlot();
    
    this.intervalId = setInterval(async () => {
      try {
        await this.produceBlock(this.currentSlot);
        this.currentSlot++;
        await this.checkEpochTransition();
      } catch (error) {
        console.error('Block production failed:', error);
      }
    }, this.config.slotDuration);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSpeed(multiplier: number) {
    this.config.slotDuration = 400 / multiplier;
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }
}
```

## Simulation Controls

The user should be able to:
- **Start/Stop** simulation
- **Adjust speed**: 0.5x, 1x, 2x, 5x, 10x
- **Reset**: Clear all data and start fresh
- **Manual advance**: Produce single block on demand
- **Time travel**: Jump to specific slot (for testing)

## Constants (lib/utils/constants.ts)

```typescript
export const SOLANA_CONSTANTS = {
  LAMPORTS_PER_SOL: 1_000_000_000,
  DEFAULT_SLOT_DURATION_MS: 400,
  SLOTS_PER_EPOCH: 432_000, // ~2 days at 400ms
  MAX_TX_PER_BLOCK: 1000,
  BASE_FEE_LAMPORTS: 5000,
  SYSTEM_PROGRAM_ID: '11111111111111111111111111111111',
  RENT_EXEMPT_MINIMUM: 890_880, // lamports for 0 byte account
};
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## UI Components Needed (shadcn)

```bash
npx shadcn@latest add button card badge table tabs scroll-area separator skeleton input label select slider switch toast dialog dropdown-menu tooltip progress
```

## Nice-to-Have Features (Future)

- [ ] Multiple cluster support (mainnet-beta, devnet, testnet simulation)
- [ ] Program deployment simulation
- [ ] Token program with SPL tokens
- [ ] NFT minting simulation
- [ ] Staking and delegation
- [ ] Network partitioning simulation
- [ ] Replay historical mainnet blocks
- [ ] WebSocket RPC compatibility
- [ ] Export data for analysis

## Notes

- For real 400ms block production, the simulation engine should run client-side or in a dedicated worker
- Supabase Edge Functions have cold start latency, not ideal for sub-second timing
- Consider using Vercel Edge Runtime or a dedicated Node process for production
- The simulation is educational - it simplifies many Solana internals (BPF, Sealevel, Tower BFT)