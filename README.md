# klodchain

> Autonomous blockchain simulator powered by AI agents.

![klodchain](https://img.shields.io/badge/klodchain-autonomous%20blockchain-green)

## Overview

klodchain is an educational blockchain simulator featuring 6 autonomous KLOD agents that manage the network. Built with Next.js and Supabase, it demonstrates real-time block production, transaction processing, and consensus mechanisms.

## Features

- **6 Autonomous KLOD Agents**
  - KLOD Validator - Block validation
  - KLOD Architect - Network architecture
  - KLOD Analyst - Transaction analysis
  - KLOD Reviewer - Consensus review
  - KLOD Consensus - Consensus management
  - KLOD Oracle - External data

- **Real-time Block Production** - Configurable block intervals with Vercel Cron
- **Transaction Processing** - Transfer validation, fee handling, account state updates
- **Proof of History (PoH)** - Sequential hash chain simulation
- **Live Dashboard** - Real-time block feed, TPS counter, validator leaderboard
- **Block Explorer** - Search blocks, transactions, and accounts

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Realtime)
- **State**: Zustand + Supabase Realtime subscriptions
- **Deployment**: Vercel + Vercel Cron

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/buildwithrekt/klodchain.git
cd klodchain

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. Go to your Supabase project
2. Open SQL Editor
3. Run `supabase/migrations/001_initial_schema.sql` for fresh setup
4. Or run `supabase/migrations/002_add_agents_and_rls.sql` if tables already exist

## Project Structure

```
src/
├── app/
│   ├── api/blockchain/     # Block production API
│   ├── explorer/           # Block explorer pages
│   └── page.tsx            # Dashboard
├── components/
│   ├── dashboard/          # Dashboard components
│   ├── layout/             # Header, Footer
│   ├── simulation/         # Simulation controls
│   └── ui/                 # shadcn components
├── hooks/                  # Supabase real-time hooks
├── lib/
│   ├── simulation/         # Core blockchain logic
│   ├── supabase/           # Supabase clients
│   └── utils/              # Constants, formatters
├── stores/                 # Zustand stores
└── types/                  # TypeScript types
```

## API Endpoints

- `POST /api/blockchain/produce-block` - Produce a new block
- `GET /api/blockchain/status` - Get network status

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The Vercel Cron job (`vercel.json`) automatically produces blocks every minute.

## Currency

The native currency is **KLOD** (1 KLOD = 1,000,000,000 lamports).

## License

MIT

## Author

Built with Claude by [@buildwithrekt](https://github.com/buildwithrekt)
