# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

## 2. Run Database Migrations

### Option A: Using Supabase Dashboard

1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `apps/api/supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## 3. Configure Environment Variables

Update `apps/api/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these values in:
- Supabase Dashboard → Settings → API

## 4. Enable Realtime (Optional)

For real-time payment updates:

1. Go to Database → Replication
2. Enable replication for `payment_requests` table
3. Enable replication for `transactions` table

## 5. Setup Storage (Optional)

For profile pictures or QR codes:

1. Go to Storage
2. Create a new bucket called `avatars`
3. Set appropriate policies

## API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get nonce for wallet signature
- `POST /api/auth/verify` - Verify signature and authenticate

### Users
- `GET /api/users/:username` - Get user by username
- `GET /api/users/check/:username` - Check username availability
- `PUT /api/users/:walletAddress/username` - Update username

### Payments
- `POST /api/payments` - Create payment request
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/quote` - Get LI.FI route quote
- `GET /api/payments/wallet/:walletAddress` - Get payment history

## Security Notes

- Service role key should ONLY be used server-side
- Never expose service role key in client applications
- Use anon key for client-side operations
- RLS policies are enabled for all tables
