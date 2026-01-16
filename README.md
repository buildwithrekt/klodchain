# klodchain

> An autonomous blockchain simulator designed by Claude AI

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://klodchain.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)

**klodchain** is a real-time blockchain simulator that demonstrates core blockchain concepts through an autonomous network of 6 AI agents. Built as an educational tool to understand Solana-like architecture.

## Features

- **Real-time Block Production** - Blocks produced every ~4 seconds by autonomous validators
- **6 KLOD Agents** - Validator, Architect, Analyst, Reviewer, Consensus, Oracle
- **Transaction System** - Transfer, stake, vote, program calls with realistic fees
- **Live Explorer** - Search blocks, transactions, accounts with instant results
- **Epoch Progress** - Track network progression through epochs
- **Smart Search** - Find any entity by partial hash, signature, or pubkey
- **Proof of History (PoH)** - Sequential hash chain simulation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL + Realtime) |
| State Management | Zustand |
| Deployment | Vercel (with Cron for block production) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     klodchain                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  KLOD   │  │  KLOD   │  │  KLOD   │  │  KLOD   │    │
│  │Validator│  │Architect│  │ Analyst │  │Reviewer │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│  ┌────┴────┐  ┌────┴────┐                              │
│  │  KLOD   │  │  KLOD   │                              │
│  │Consensus│  │ Oracle  │                              │
│  └────┬────┘  └────┬────┘                              │
│       └──────┬─────┘                                   │
│              ▼                                         │
│     ┌─────────────────┐                                │
│     │ Block Producer  │ ◄── Vercel Cron (1/min)       │
│     │   (15 blocks)   │                                │
│     └────────┬────────┘                                │
│              ▼                                         │
│     ┌─────────────────┐                                │
│     │    Supabase     │                                │
│     │   (Realtime)    │                                │
│     └────────┬────────┘                                │
│              ▼                                         │
│     ┌─────────────────┐                                │
│     │  Next.js App    │                                │
│     │   (Dashboard)   │                                │
│     └─────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### blocks
| Column | Type | Description |
|--------|------|-------------|
| slot | bigint | Block height |
| blockhash | text | Unique block identifier |
| leader_pubkey | text | Validator who produced the block |
| transaction_count | integer | Number of transactions |
| poh_hash | text | Proof of History hash |

### transactions
| Column | Type | Description |
|--------|------|-------------|
| signature | text | Transaction signature |
| status | text | pending / confirmed / failed |
| transaction_type | text | transfer / stake / vote / program_call |
| from_pubkey | text | Sender address |
| to_pubkey | text | Recipient address |
| amount | bigint | Amount in lamports |
| fee | bigint | Transaction fee |
| program_id | text | Program being called |

### validators
| Column | Type | Description |
|--------|------|-------------|
| pubkey | text | Validator address |
| name | text | Display name |
| stake | bigint | Staked amount |
| blocks_produced | integer | Total blocks produced |

## Local Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/buildwithrekt/klodchain.git
cd klodchain
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Run the development server**
```bash
pnpm dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Database Setup

Run the SQL migrations in your Supabase dashboard:

```sql
-- See /supabase/migrations/ for full schema
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Dashboard
│   ├── explorer/                # Block & TX explorer
│   │   ├── block/[slot]/        # Block detail page
│   │   └── tx/[signature]/      # Transaction detail page
│   ├── roadmap/                 # Project roadmap
│   └── api/
│       ├── blockchain/          # Block production API
│       └── search/              # Search API
├── components/
│   ├── dashboard/               # Dashboard components
│   │   ├── AgentNetwork.tsx     # KLOD agents status
│   │   ├── BlockFeed.tsx        # Recent blocks
│   │   ├── TransactionFeed.tsx  # Recent transactions
│   │   ├── NetworkStats.tsx     # Stats cards
│   │   ├── EpochProgress.tsx    # Epoch progress bar
│   │   └── ValidatorLeaderboard.tsx
│   ├── layout/                  # Header, Footer
│   └── ui/                      # shadcn components
├── stores/
│   └── simulation-store.ts      # Zustand store
├── hooks/                       # Custom React hooks
├── lib/
│   ├── supabase/               # Supabase clients
│   └── utils/                  # Formatters, constants
└── types/                      # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blockchain/produce-block` | GET/POST | Produce blocks (called by cron) |
| `/api/search` | GET | Search blocks, transactions, accounts |

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The `vercel.json` configures a cron job to produce blocks every minute:

```json
{
  "crons": [
    {
      "path": "/api/blockchain/produce-block",
      "schedule": "* * * * *"
    }
  ]
}
```

## Roadmap

- [x] **Phase 1**: Core Infrastructure - Blocks, transactions, validators, explorer
- [ ] **Phase 2**: Wallet & Accounts - Faucet, wallet connection
- [ ] **Phase 3**: Tokens & Programs - SPL-like tokens, NFTs
- [ ] **Phase 4**: Staking & Governance - Delegation, voting
- [ ] **Phase 5**: Analytics & API - Charts, public API
- [ ] **Phase 6**: Advanced Features - DeFi simulation, agent personalities

## Currency

The native currency is **KLOD**:
- 1 KLOD = 1,000,000,000 lamports
- Transaction fees: 0.000005 - 0.00005 KLOD

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and experimentation.

## Credits

Built with [Claude Code](https://claude.ai/claude-code) by [@buildwithrekt](https://github.com/buildwithrekt)

---

**Disclaimer**: This is an educational simulator. KLOD tokens have no real value. The blockchain is simulated and does not provide actual consensus or security guarantees.
