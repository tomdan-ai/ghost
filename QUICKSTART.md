# Ghost Wallet - Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/api/.env` with your PostgreSQL connection string.

### 3. Setup Database

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
cd ../..
```

### 4. Start Development

```bash
pnpm dev
```

This starts:
- API on http://localhost:3001
- Web on http://localhost:3000
- Mobile with Expo

### 5. Deploy Solana Contracts (Optional)

```bash
# Start local validator
solana-test-validator

# In another terminal
cd blockchain/contracts
anchor build
anchor deploy
```

## 📱 Mobile Development

```bash
cd apps/mobile
npx expo start
```

Scan QR code with Expo Go app.

## 🧪 Testing

```bash
# Test contracts
cd blockchain/contracts
anchor test

# Test API
cd apps/api
pnpm test
```

## 📚 Next Steps

- Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Check [API.md](docs/API.md)
- See [SETUP.md](docs/SETUP.md) for detailed setup

## 🆘 Troubleshooting

**Database connection fails:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env

**Solana errors:**
- Run `solana config get`
- Ensure local validator is running

**Mobile app won't start:**
- Clear cache: `npx expo start -c`
- Reinstall: `rm -rf node_modules && pnpm install`
