# Ghost Wallet Architecture

## System Overview

Ghost is a cross-chain payment system built on Solana that enables username-based payments from any blockchain.

## Core Components

### 1. Mobile App (React Native)
- Primary user interface
- Wallet management
- Payment requests
- QR code generation
- Push notifications

### 2. Web App (Next.js)
- Marketing pages
- Payment links (ghost.app/pay/username)
- Public profiles
- Web-based payments

### 3. Backend API (Express)
- User authentication
- Username registry
- Payment orchestration
- LI.FI integration
- WebSocket for realtime updates

### 4. Smart Contracts (Solana)
- Username registry
- Payment verification
- Optional escrow

## Data Flow

### Payment Flow

1. Sender opens `ghost.app/pay/tom`
2. Selects source chain and amount
3. Backend queries LI.FI for route
4. Sender signs transaction
5. LI.FI bridges/swaps to Solana USDC
6. Receiver notified via WebSocket
7. Funds appear in receiver's wallet

### Username Registration

1. User connects wallet
2. Checks username availability
3. Registers on-chain via smart contract
4. Backend indexes registration
5. Username becomes active

## Security

- Wallet-based authentication
- Nonce-based signature verification
- Rate limiting on API
- Transaction validation
- Secure session storage

## Scalability

- Horizontal API scaling
- Redis for caching
- BullMQ for job queues
- Indexed blockchain data
- CDN for static assets
