# Blockchain Integration Quick Start 🚀

## Prerequisites
- Solana CLI installed
- Local validator running
- Program deployed
- Payer keypair configured

## 5-Minute Setup

### 1. Generate Keypair (if not done)
```bash
cd apps/api
./scripts/setup-solana.sh
```

Copy the base58 private key and add to `.env`:
```env
SOLANA_PAYER_PRIVATE_KEY=your_key_here
```

### 2. Start Validator
```bash
cd blockchain/contracts
solana-test-validator
```

### 3. Deploy Program
```bash
cd blockchain/contracts
anchor deploy
```

### 4. Fund Payer
```bash
solana airdrop 10 $(solana-keygen pubkey ~/.config/solana/ghost-api-payer.json) --url localhost
```

### 5. Start API
```bash
cd apps/api
pnpm dev
```

## Test It Works

### Check Health
```bash
curl http://localhost:4500/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "blockchain": "listening"
}
```

### Register Username
```bash
curl -X POST http://localhost:4500/api/users/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}'
```

### Create Payment
```bash
curl -X POST http://localhost:4500/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverWallet": "WALLET_ADDRESS",
    "receiverUsername": "alice",
    "amount": "100",
    "sourceChain": "ethereum",
    "destinationChain": "solana"
  }'
```

## Common Commands

### Check Solana Balance
```bash
solana balance $(solana-keygen pubkey ~/.config/solana/ghost-api-payer.json) --url localhost
```

### View Program Logs
```bash
solana logs --url localhost
```

### Check Program Account
```bash
solana program show 5v95TCKx8XvdXKnGjFQUumdNwdAuM6prvcYx6YfZxBKH --url localhost
```

### Restart Everything
```bash
# Kill validator
pkill -9 -f solana-test-validator

# Restart
cd blockchain/contracts
solana-test-validator --reset

# Redeploy
anchor deploy

# Restart API
cd apps/api
pnpm dev
```

## Environment Variables

### Development (.env)
```env
SOLANA_RPC_URL=http://localhost:8899
SOLANA_PAYER_PRIVATE_KEY=your_key
ENABLE_BLOCKCHAIN_LISTENER=true
```

### Production
```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PAYER_PRIVATE_KEY=your_production_key
ENABLE_BLOCKCHAIN_LISTENER=true
```

### Devnet
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PAYER_PRIVATE_KEY=your_devnet_key
ENABLE_BLOCKCHAIN_LISTENER=true
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Start `solana-test-validator` |
| "Insufficient funds" | Run `solana airdrop 10 ...` |
| "Program not found" | Run `anchor deploy` |
| "Keypair not found" | Run `./scripts/setup-solana.sh` |
| "Listener not starting" | Check `ENABLE_BLOCKCHAIN_LISTENER=true` |

## Features Enabled

✅ **Phase 1: Username Registry**
- Register username on-chain
- Check availability (DB + blockchain)
- Resolve username to wallet
- Update wallet address
- Sync blockchain data

✅ **Phase 2: Payment References**
- Create payment reference on-chain
- Track payment status
- Claim payments
- Cancel payments
- Real-time notifications

## API Endpoints Summary

### Usernames
- `GET /api/users/check/:username` - Check availability
- `POST /api/users/register` - Register username
- `GET /api/users/resolve/:username` - Resolve username

### Payments
- `POST /api/payments/create` - Create payment
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments/:id/cancel` - Cancel payment
- `GET /api/payments/username/:username` - Get by username
- `POST /api/payments/:id/sync` - Sync from blockchain

### Health
- `GET /health` - Check system status

## WebSocket Events

```javascript
// Connect
const socket = io('http://localhost:4500');

// Subscribe
socket.emit('subscribe:payment', paymentId);
socket.emit('subscribe:user', walletAddress);

// Listen
socket.on('payment:incoming', callback);
socket.on('payment:claimed', callback);
socket.on('payment:cancelled', callback);
socket.on('payment:status', callback);
```

## Next Steps

1. **Test the integration** - Use the API endpoints
2. **Monitor logs** - Watch for blockchain events
3. **Build frontend** - Connect your UI to the API
4. **Deploy to devnet** - Test on Solana devnet
5. **Production** - Deploy to mainnet

## Resources

- [Solana Integration Guide](./SOLANA_INTEGRATION.md)
- [Phase 2 Payments](./PHASE2_PAYMENTS.md)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
