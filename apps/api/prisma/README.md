# Database Setup for Ghost Wallet Backend

This directory contains the Prisma schema and migrations for the Ghost Wallet Backend API.

## Database Schema

The database consists of 4 main tables:

### 1. `users` - User Accounts
- `id`: UUID primary key
- `wallet_address`: Unique wallet address (Solana/Ethereum)
- `username`: Unique username
- `created_at`: Timestamp

### 2. `username_registry` - Username Registration
- `id`: UUID primary key
- `username`: Unique username
- `wallet_address`: Unique wallet address
- `user_id`: Foreign key to users table
- `created_at`: Timestamp

### 3. `payment_requests` - Payment Transactions
- `id`: UUID primary key
- `sender_wallet`: Sender's wallet address
- `receiver_wallet`: Receiver's wallet address
- `amount`: Payment amount (stored as string for precision)
- `source_chain`: Source blockchain (e.g., "ethereum", "solana")
- `destination_chain`: Destination blockchain (always "solana" for Ghost)
- `status`: Payment status (PENDING, PROCESSING, COMPLETED, FAILED)
- `tx_hash`: Transaction hash (nullable)
- `created_at`: Timestamp

### 4. `transactions` - Transaction Details
- `id`: UUID primary key
- `payment_request_id`: Foreign key to payment_requests
- `source_tx`: Source transaction hash (nullable)
- `destination_tx`: Destination transaction hash (nullable)
- `status`: Transaction status
- `created_at`: Timestamp

## Indexes

The following indexes are created for performance:

1. `idx_users_wallet` - Fast wallet address lookups
2. `idx_users_username` - Fast username lookups
3. `idx_username_registry_username` - Fast username registry lookups
4. `idx_payment_requests_sender` - Fast sender wallet queries
5. `idx_payment_requests_receiver` - Fast receiver wallet queries
6. `idx_payment_requests_status` - Fast status-based queries
7. `idx_transactions_payment_request` - Fast payment request lookups

## Constraints

- Unique constraints on `wallet_address` and `username` in `users` table
- Unique constraint on `username` in `username_registry` table
- Foreign key constraints between `transactions` and `payment_requests`
- Cascade delete for related records

## Row Level Security (RLS)

RLS policies are implemented in the Supabase migration file (`../supabase/migrations/001_initial_schema.sql`):

1. **Users table**: Viewable by everyone, updatable by owner
2. **Payment requests**: Viewable by sender/receiver, creatable by anyone
3. **Username registry**: Viewable by everyone, registrable by user

## Prisma Commands

### Development
```bash
# Generate Prisma client
pnpm run prisma:generate

# Create and apply migrations
pnpm run prisma:migrate

# Open Prisma Studio (database GUI)
pnpm run prisma:studio

# Reset database (development only)
pnpm run prisma:reset
```

### Production
```bash
# Generate Prisma client
pnpm run prisma:generate

# Apply migrations (no interactive prompts)
pnpm run prisma:migrate:deploy
```

### Setup
```bash
# Complete database setup (dev)
pnpm run db:setup

# Deploy to production
pnpm run db:deploy
```

## Seeding

To seed the database with test data:
```bash
# Run the seed script
npx tsx prisma/seed.ts
```

## Environment Variables

Prisma uses the `DATABASE_URL` environment variable. In production, this is constructed from:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

The connection string format is:
```
postgresql://postgres:{SERVICE_ROLE_KEY}@db.{PROJECT_REF}.supabase.co:5432/postgres?sslmode=require
```

## Migration Strategy

1. **Development**: Use `prisma migrate dev` for schema changes
2. **Production**: Use `prisma migrate deploy` to apply migrations
3. **Backup**: Always backup before major schema changes
4. **Rollback**: Use Supabase dashboard for emergency rollbacks

## Notes

- The Prisma schema (`schema.prisma`) should match the Supabase migration
- Always test migrations in development before deploying to production
- Use Prisma Studio for database inspection during development
- Monitor database performance with Supabase dashboard metrics