# Ghost Wallet Setup Guide

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Rust + Solana CLI
- Anchor Framework >= 0.29
- PostgreSQL >= 14
- Redis (optional, for production)

## Installation Steps

### 1. Clone and Install

```bash
git clone https://github.com/ghost-wallet/ghost.git
cd ghost
pnpm install
```

### 2. Setup Environment Variables

Copy `.env.example` files in each app:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Edit each `.env` file with your values.

### 3. Setup Database

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Start Development

```bash
# From root directory
pnpm dev
```

Or start each app individually:

```bash
# API
cd apps/api && pnpm dev

# Web
cd apps/web && pnpm dev

# Mobile
cd apps/mobile && npx expo start
```

### 5. Setup Solana (Local Development)

```bash
# Start local validator
solana-test-validator

# Deploy contracts
cd blockchain/contracts
anchor build
anchor deploy
```

## Mobile Development

### Android APK Build

```bash
cd apps/mobile
eas build --platform android
```

### iOS Build

```bash
cd apps/mobile
eas build --platform ios
```

## Troubleshooting

- If Prisma fails, ensure PostgreSQL is running
- For Solana errors, check `solana config get`
- For mobile issues, clear cache: `npx expo start -c`
