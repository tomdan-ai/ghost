# Ghost Registry Smart Contract

Solana smart contract for Ghost Wallet username registry and payment references.

## Features

### Username Registry
- Register unique usernames (3-32 characters)
- Map usernames to Solana wallet addresses
- Update wallet address for existing username
- Close/delete username registration
- PDA-based for security and determinism

### Payment References
- Create payment references for cross-chain transactions
- Track sender, receiver, amount, and source chain
- Payment status tracking (Pending/Claimed/Cancelled)
- Claim and cancel functionality
- Authorization checks for security

## Setup

### Prerequisites
- Rust >= 1.70
- Solana CLI >= 1.17
- Anchor >= 0.29

### Installation

```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install dependencies
pnpm install
```

### Build

```bash
anchor build
```

### Test

```bash
# Start local validator
solana-test-validator

# Run tests (in another terminal)
anchor test --skip-local-validator
```

### Deploy

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Program Structure

### Instructions

**Username Management:**
- `register_username(username: String)` - Register a new username
- `update_wallet()` - Update wallet address for username
- `close_username()` - Delete username registration

**Payment References:**
- `create_payment_reference(id, amount, source_chain)` - Create payment reference
- `claim_payment_reference(id)` - Mark payment as claimed
- `cancel_payment_reference(id)` - Cancel payment reference

### Accounts

**UsernameRegistry:**
- `username: String` - The registered username
- `wallet: Pubkey` - Associated wallet address
- `bump: u8` - PDA bump seed
- `created_at: i64` - Unix timestamp

**PaymentReference:**
- `id: String` - Unique payment identifier
- `sender: Pubkey` - Payment sender
- `receiver: Pubkey` - Payment receiver
- `amount: u64` - Payment amount in lamports
- `source_chain: String` - Source blockchain
- `status: PaymentStatus` - Current status
- `bump: u8` - PDA bump seed
- `created_at: i64` - Unix timestamp

### Events

All state changes emit events for off-chain indexing:
- `UsernameRegistered`
- `WalletUpdated`
- `PaymentReferenceCreated`
- `PaymentReferenceClaimed`
- `PaymentReferenceCancelled`

## Security

- PDA-based accounts prevent address collisions
- Authorization checks on all mutations
- Username length validation (3-32 chars)
- Payment status validation prevents double-claiming
- Signer verification on sensitive operations

## Integration

### JavaScript/TypeScript

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GhostRegistry } from "./target/types/ghost_registry";

const program = anchor.workspace.GhostRegistry as Program<GhostRegistry>;

// Register username
const [registryPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("registry"), Buffer.from("alice")],
  program.programId
);

await program.methods
  .registerUsername("alice")
  .accounts({
    registry: registryPda,
    user: wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();
```

## License

MIT
