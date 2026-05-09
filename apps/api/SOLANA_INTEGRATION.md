# Solana Integration Guide

## Phase 1: Setup & Username Registry ✅

### What's Integrated

1. **Solana Connection & Configuration** (`src/config/solana.ts`)
   - Connection to Solana RPC
   - Anchor program initialization
   - PDA derivation helpers

2. **Blockchain Username Service** (`src/modules/username/solana.service.ts`)
   - Register username on-chain
   - Check username availability
   - Fetch username registry data
   - Update wallet address
   - Close username registry

3. **Hybrid Username Service** (`src/modules/username/username.service.ts`)
   - Checks both database and blockchain
   - Registers on-chain first, then database
   - Syncs blockchain data to database

### Setup Instructions

#### 1. Install Dependencies
```bash
cd apps/api
pnpm install
```

#### 2. Generate Solana Keypair
```bash
./scripts/setup-solana.sh
```

This will:
- Generate a new keypair at `~/.config/solana/ghost-api-payer.json`
- Display the base58 private key
- Show the public key

#### 3. Configure Environment
Add to your `.env`:
```env
SOLANA_RPC_URL=http://localhost:8899
SOLANA_PAYER_PRIVATE_KEY=<your_base58_private_key>
```

#### 4. Start Local Validator & Deploy
```bash
# Terminal 1: Start validator
cd ../../blockchain/contracts
solana-test-validator

# Terminal 2: Deploy program
cd ../../blockchain/contracts
anchor deploy

# Terminal 3: Airdrop SOL to payer
solana airdrop 10 $(solana-keygen pubkey ~/.config/solana/ghost-api-payer.json) --url localhost
```

#### 5. Start API Server
```bash
cd apps/api
pnpm dev
```

### API Endpoints

#### Check Username Availability
```bash
GET /api/users/check/:username
```

Response:
```json
{
  "available": true
}
```

#### Register Username
```bash
POST /api/users/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "alice"
}
```

Response:
```json
{
  "id": "...",
  "username": "alice",
  "walletAddress": "...",
  "onChainAddress": "...",
  "registrationTx": "...",
  "blockchainSignature": "..."
}
```

#### Resolve Username
```bash
GET /api/users/resolve/:username
```

Response:
```json
{
  "username": "alice",
  "walletAddress": "...",
  "onChainAddress": "...",
  "user": { ... }
}
```

### How It Works

1. **Username Registration Flow**:
   ```
   Client Request
   ↓
   Check availability (DB + Blockchain)
   ↓
   Register on Solana blockchain
   ↓
   Save to database with tx signature
   ↓
   Return success with blockchain proof
   ```

2. **Username Resolution**:
   ```
   Client Request
   ↓
   Check database (fast)
   ↓
   If not found, check blockchain
   ↓
   Return username data
   ```

### Testing

```bash
# Check availability
curl http://localhost:4500/api/users/check/alice

# Register (requires auth token)
curl -X POST http://localhost:4500/api/users/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}'

# Resolve
curl http://localhost:4500/api/users/resolve/alice
```

### Database Schema Updates Needed

Add these fields to your `UsernameRegistry` model:

```prisma
model UsernameRegistry {
  id              String   @id @default(cuid())
  username        String   @unique
  walletAddress   String   @unique
  userId          String
  onChainAddress  String?  // PDA address on Solana
  registrationTx  String?  // Transaction signature
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

Run migration:
```bash
cd apps/api
npx prisma migrate dev --name add_blockchain_fields
```

## Next Phases

### Phase 2: Payment References (Coming Next)
- Create payment references on-chain
- Track cross-chain payment status
- Claim/cancel payment references

### Phase 3: Event Listening
- Listen to blockchain events
- Real-time payment notifications
- Sync blockchain state to database

### Phase 4: Advanced Features
- Batch operations
- Transaction retry logic
- Gas optimization
- Error recovery

## Troubleshooting

### "SOLANA_PAYER_PRIVATE_KEY not set"
Run `./scripts/setup-solana.sh` and add the key to `.env`

### "Program ID mismatch"
Make sure the program is deployed and the ID in `src/config/solana.ts` matches

### "Insufficient funds"
Airdrop SOL to your payer account:
```bash
solana airdrop 10 $(solana-keygen pubkey ~/.config/solana/ghost-api-payer.json) --url localhost
```

### "Connection refused"
Make sure `solana-test-validator` is running

## Architecture

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Server    │
│  (Express.js)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│Database│ │Solana Network│
│(Prisma)│ │  (Anchor)    │
└────────┘ └──────────────┘
```

- **Database**: Fast reads, caching, user data
- **Blockchain**: Source of truth, immutable records
- **API**: Orchestrates both, handles auth
