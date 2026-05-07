# Ghost Wallet

**Universal Cross-Chain Stablecoin Identity Layer**

Ghost enables users to receive payments through usernames, accept payments from multiple chains, and settle into Solana automatically with a mobile-first crypto UX.

## Core Concept

Anyone can pay you from any chain, while you receive stablecoins on Solana.

## Architecture

```
ghost/
├── apps/
│   ├── mobile/        # React Native APK
│   ├── web/           # Marketing + payment pages
│   └── api/           # Express backend
├── blockchain/
│   └── contracts/     # Solana smart contracts
└── packages/
    ├── shared-types/
    ├── ui/
    └── sdk/
```

## Tech Stack

- **Mobile**: React Native + Expo
- **Web**: Next.js
- **Backend**: Node.js + Express
- **Blockchain**: Solana + Rust + Anchor
- **Database**: PostgreSQL + Prisma
- **Cross-chain**: LI.FI SDK

## Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Rust + Solana CLI
- Anchor Framework
- PostgreSQL

### Installation

```bash
# Install dependencies
pnpm install

# Setup database
cd apps/api
pnpm prisma migrate dev

# Start development
pnpm dev
```

### Individual Apps

```bash
# API
cd apps/api && pnpm dev

# Web
cd apps/web && pnpm dev

# Mobile
cd apps/mobile && npx expo start

# Solana Contracts
cd blockchain/contracts
anchor build
anchor deploy
```

## Environment Variables

See `.env.example` files in each app directory.

## MVP Features

✅ Username registry
✅ Payment links
✅ Cross-chain LI.FI routing
✅ Solana settlement
✅ Mobile APK
✅ Wallet auth
✅ Transaction tracking

## License

MIT
