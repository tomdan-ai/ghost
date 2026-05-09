# Phase 2: Payment References Integration ✅

## Overview

Phase 2 integrates the payment reference system from the Solana blockchain into the backend API. This enables:
- Creating payment references on-chain
- Tracking payment status across chains
- Real-time payment notifications
- Claiming and cancelling payments

## What's New

### 1. Solana Payment Service (`src/modules/payment/solana.service.ts`)
Handles all blockchain payment operations:
- `createPaymentReference()` - Create payment reference on-chain
- `getPaymentReference()` - Fetch payment data from blockchain
- `claimPaymentReference()` - Mark payment as claimed
- `cancelPaymentReference()` - Cancel pending payment
- `getPaymentsByUsername()` - Get all payments for a username
- `getPaymentsBySender()` - Get payments sent by wallet
- `getPaymentsByReceiver()` - Get payments received by wallet

### 2. Enhanced Payment Service (`src/modules/payment/payment.service.ts`)
Now integrates with blockchain:
- Creates on-chain reference when payment is created
- Automatically claims on blockchain when payment completes
- Syncs blockchain data to database
- Emits real-time events via WebSocket

### 3. Blockchain Event Listener (`src/modules/payment/blockchain-listener.ts`)
Listens to on-chain events:
- `PaymentReferenceCreated` - New payment created
- `PaymentReferenceClaimed` - Payment claimed by receiver
- `PaymentReferenceCancelled` - Payment cancelled by sender

### 4. Updated Payment Routes
New endpoints:
- `POST /api/payments/:id/cancel` - Cancel a payment
- `GET /api/payments/username/:username` - Get payments by username
- `POST /api/payments/:id/sync` - Sync payment from blockchain

## API Endpoints

### Create Payment with Blockchain Reference
```bash
POST /api/payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverWallet": "...",
  "receiverUsername": "alice",
  "amount": "100",
  "sourceChain": "ethereum",
  "destinationChain": "solana"
}
```

Response:
```json
{
  "id": "payment_123",
  "senderWallet": "...",
  "receiverWallet": "...",
  "amount": "100",
  "status": "PENDING",
  "onChainAddress": "...",
  "creationTx": "..."
}
```

### Get Payment with Blockchain Data
```bash
GET /api/payments/:id?username=alice
```

Response:
```json
{
  "id": "payment_123",
  "senderWallet": "...",
  "receiverWallet": "...",
  "amount": "100",
  "status": "PENDING",
  "blockchain": {
    "id": "payment_123",
    "sender": "...",
    "receiver": "...",
    "amount": 100000000000,
    "sourceChain": "ethereum",
    "status": "Pending",
    "createdAt": 1234567890,
    "pda": "..."
  }
}
```

### Cancel Payment
```bash
POST /api/payments/:id/cancel
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "payment_123",
  "status": "CANCELLED",
  "cancelTx": "..."
}
```

### Get Payments by Username
```bash
GET /api/payments/username/alice
```

Response:
```json
[
  {
    "id": "payment_123",
    "blockchain": {
      "id": "payment_123",
      "sender": "...",
      "receiver": "...",
      "amount": 100000000000,
      "status": "Pending"
    }
  }
]
```

### Sync Payment from Blockchain
```bash
POST /api/payments/:id/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "alice"
}
```

## Real-Time Events

### WebSocket Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4500');

// Subscribe to payment updates
socket.emit('subscribe:payment', 'payment_123');

// Subscribe to user notifications
socket.emit('subscribe:user', 'user_wallet_address');

// Listen for events
socket.on('payment:incoming', (data) => {
  console.log('New payment:', data);
});

socket.on('payment:claimed', (data) => {
  console.log('Payment claimed:', data);
});

socket.on('payment:cancelled', (data) => {
  console.log('Payment cancelled:', data);
});

socket.on('payment:status', (data) => {
  console.log('Payment status updated:', data);
});
```

## Payment Flow

### 1. Create Payment
```
Client → API: Create payment request
API → Database: Save payment
API → Solana: Create on-chain reference
API → Database: Update with blockchain data
API → Client: Return payment with tx signature
```

### 2. Complete Payment
```
External: Cross-chain transfer completes
Client → API: Update payment status to COMPLETED
API → Solana: Claim payment reference on-chain
API → Database: Update with claim tx
API → WebSocket: Emit payment:claimed event
```

### 3. Cancel Payment
```
Client → API: Cancel payment
API → Solana: Cancel payment reference on-chain
API → Database: Update status to CANCELLED
API → WebSocket: Emit payment:cancelled event
```

## Database Schema Updates

Add these fields to your `PaymentRequest` model:

```prisma
model PaymentRequest {
  id                String        @id @default(cuid())
  senderWallet      String
  receiverWallet    String
  receiverUsername  String?
  amount            String
  sourceChain       String
  destinationChain  String
  status            PaymentStatus @default(PENDING)
  txHash            String?
  
  // Blockchain fields
  onChainAddress    String?       // PDA address on Solana
  creationTx        String?       // Transaction signature for creation
  claimTx           String?       // Transaction signature for claim
  cancelTx          String?       // Transaction signature for cancel
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  transactions      Transaction[]
  receiver          User?         @relation(fields: [receiverWallet], references: [walletAddress])
}
```

Run migration:
```bash
cd apps/api
npx prisma migrate dev --name add_payment_blockchain_fields
```

## Testing

### 1. Start Services
```bash
# Terminal 1: Validator
cd blockchain/contracts
solana-test-validator

# Terminal 2: Deploy
cd blockchain/contracts
anchor deploy

# Terminal 3: API
cd apps/api
pnpm dev
```

### 2. Create Payment
```bash
curl -X POST http://localhost:4500/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverWallet": "RECEIVER_WALLET",
    "receiverUsername": "alice",
    "amount": "100",
    "sourceChain": "ethereum",
    "destinationChain": "solana"
  }'
```

### 3. Check Blockchain
```bash
# Get payment from blockchain
curl http://localhost:4500/api/payments/PAYMENT_ID?username=alice

# Get all payments for username
curl http://localhost:4500/api/payments/username/alice
```

### 4. Cancel Payment
```bash
curl -X POST http://localhost:4500/api/payments/PAYMENT_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Configuration

### Environment Variables
```env
# Enable/disable blockchain listener
ENABLE_BLOCKCHAIN_LISTENER=true

# Solana RPC URL
SOLANA_RPC_URL=http://localhost:8899

# Payer keypair
SOLANA_PAYER_PRIVATE_KEY=your_base58_key
```

### Disable Blockchain Listener
Set `ENABLE_BLOCKCHAIN_LISTENER=false` in `.env` to disable real-time event listening.

## Architecture

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Server    │
│  ┌───────────┐  │
│  │ WebSocket │  │ ← Real-time events
│  └───────────┘  │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────────┐
│Database│ │Solana Network│
│        │ │  ┌────────┐  │
│        │ │  │Listener│  │ ← Blockchain events
│        │ │  └────────┘  │
└────────┘ └──────────────┘
```

## Troubleshooting

### "Failed to create payment reference"
- Check validator is running
- Ensure payer has SOL: `solana balance`
- Verify program is deployed: `solana program show PROGRAM_ID`

### "Blockchain listener not starting"
- Check `ENABLE_BLOCKCHAIN_LISTENER=true` in `.env`
- Verify RPC connection: `curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`

### Events not firing
- Check WebSocket connection in browser console
- Verify client is subscribed: `socket.emit('subscribe:payment', paymentId)`
- Check API logs for event emissions

## Next Steps

### Phase 3: Advanced Features
- Transaction retry logic with exponential backoff
- Batch payment operations
- Gas optimization strategies
- Payment escrow system
- Multi-signature support

### Phase 4: Production Readiness
- Rate limiting for blockchain calls
- Caching layer for blockchain data
- Monitoring and alerting
- Error recovery mechanisms
- Load testing
