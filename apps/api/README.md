# Ghost Wallet Backend API

Express.js TypeScript API for Ghost Wallet - Universal Cross-Chain Stablecoin Identity Layer.

## Features

- **Wallet-Based Authentication**: Secure authentication using wallet signatures with nonce verification
- **Username Registration**: Unique username system for payment discovery
- **Cross-Chain Payments**: Integration with LI.FI for cross-chain routing to Solana USDC
- **Real-Time Updates**: WebSocket support for payment status notifications
- **Transaction Tracking**: Complete payment history and audit trails
- **Rate Limiting**: DDoS protection with Redis-based rate limiting
- **Environment Validation**: Comprehensive environment variable validation on startup

## Tech Stack

- **Runtime**: Node.js 18+, TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **Database**: Supabase/PostgreSQL
- **Cache & Rate Limiting**: Redis
- **Validation**: Zod for runtime type safety
- **Testing**: Jest with TypeScript support
- **Linting**: ESLint with TypeScript rules
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- Redis (for caching and rate limiting)
- Supabase account (for database)

### Installation

1. **Navigate to the API directory:**
   ```bash
   cd apps/api
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your actual values:
   ```env
   # Required: Get these from your Supabase project
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Required: Get from LI.FI dashboard
   LIFI_API_KEY=your-lifi-api-key
   
   # Required: Generate a secure JWT secret
   JWT_SECRET=your-32-character-minimum-secret-here
   
   # Optional: Adjust as needed
   REDIS_URL=redis://localhost:6379
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Run database migrations:**
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`

5. **Start the development server:**
   ```bash
   pnpm run dev
   ```

   The API will be available at `http://localhost:3001`

## Development

### Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm run start` - Start production server
- `pnpm run start:dev` - Start development server with environment
- `pnpm run start:prod` - Start production server with environment
- `pnpm run test` - Run tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Run tests with coverage report
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues
- `pnpm run type-check` - TypeScript type checking without emitting
- `pnpm run validate` - Run type checking and linting
- `pnpm run clean` - Clean build artifacts

### Project Structure

```
src/
├── config/           # Configuration modules
│   ├── env.ts       # Environment validation
│   ├── supabase.ts  # Supabase client
│   └── database.ts  # Database configuration
├── modules/         # Business logic modules
│   ├── auth/        # Authentication
│   ├── username/    # Username registration
│   └── payment/     # Payment processing
├── routes/          # Express route handlers
├── middleware/      # Express middleware
├── types/           # TypeScript type definitions
├── websocket/       # WebSocket server
└── index.ts         # Application entry point
```

### Environment Variables

All environment variables are validated on application startup. See `.env.example` for the complete list.

**Required Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `LIFI_API_KEY` - LI.FI API key for cross-chain routing
- `JWT_SECRET` - Secret for JWT token signing (min 32 chars)

**Optional Variables (with defaults):**
- `REDIS_URL` - Redis connection URL (`redis://localhost:6379`)
- `PORT` - Server port (`3001`)
- `NODE_ENV` - Environment (`development`)
- `CORS_ORIGIN` - Allowed CORS origin (`http://localhost:3000`)

### TypeScript Configuration

The project uses strict TypeScript configuration with:
- Strict mode enabled
- ES2022 target
- CommonJS modules
- Source maps for debugging
- Declaration files for type safety
- Incremental compilation for faster builds

## Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

### Test Environment

Tests use a separate `.env.test` file. The test environment automatically:
- Sets `NODE_ENV=test`
- Uses test-specific configuration
- Mocks external services where appropriate

## API Documentation

### Authentication Endpoints

- `POST /api/auth/nonce` - Get a nonce for wallet authentication
- `POST /api/auth/verify` - Verify wallet signature and get JWT token

### Username Endpoints

- `GET /api/username/check/:username` - Check username availability
- `POST /api/username/register` - Register a username (authenticated)
- `GET /api/username/resolve/:username` - Resolve username to wallet address

### Payment Endpoints

- `POST /api/payment/create` - Create a payment request (authenticated)
- `GET /api/payment/route` - Get cross-chain routing options
- `GET /api/payment/history` - Get payment history (authenticated)
- `GET /api/payment/:id` - Get payment details

### Health Check

- `GET /health` - Health check endpoint with database connectivity test

### WebSocket

- Connect to `/ws` with JWT authentication
- Subscribe to payment updates: `subscribe:payment`
- Subscribe to wallet updates: `subscribe:wallet`

## Deployment

### Building for Production

```bash
# Build the application
pnpm run build

# Start in production mode
pnpm run start:prod
```

### Environment Validation

The application validates all required environment variables on startup. If any required variables are missing or invalid, the application will exit with a descriptive error message.

## Contributing

1. Ensure all tests pass: `pnpm run test`
2. Run linting: `pnpm run lint`
3. Run type checking: `pnpm run type-check`
4. Update tests for new functionality
5. Update documentation as needed

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

Tables:
- `users` - User accounts with wallet addresses
- `username_registry` - Username to wallet mapping
- `payment_requests` - Payment transactions
- `transactions` - Transaction details
