# Ghost API

Backend API for Ghost Wallet using Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run database migrations:
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`

5. Install dependencies:
```bash
pnpm install
```

6. Start development server:
```bash
pnpm dev
```

## API Endpoints

### Authentication
- `POST /api/auth/nonce` - Generate nonce for wallet signature
- `POST /api/auth/verify` - Verify signature and authenticate user

### Users
- `GET /api/users/:username` - Get user by username
- `GET /api/users/check/:username` - Check username availability
- `PUT /api/users/:walletAddress/username` - Update username

### Payments
- `POST /api/payments` - Create payment request
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/quote` - Get LI.FI route quote
- `GET /api/payments/wallet/:walletAddress` - Get payment history

## Tech Stack

- Express.js
- Supabase (PostgreSQL + Auth + Realtime)
- Socket.IO for WebSocket
- Solana Web3.js
- LI.FI SDK for cross-chain routing

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

Tables:
- `users` - User accounts with wallet addresses
- `username_registry` - Username to wallet mapping
- `payment_requests` - Payment transactions
- `transactions` - Transaction details
