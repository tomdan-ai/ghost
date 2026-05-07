# Ghost Wallet API Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/nonce

Get a nonce for wallet signature.

**Request:**
```json
{
  "walletAddress": "string"
}
```

**Response:**
```json
{
  "nonce": "string"
}
```

#### POST /auth/verify

Verify wallet signature and get auth token.

**Request:**
```json
{
  "walletAddress": "string",
  "signature": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "walletAddress": "string",
    "username": "string"
  }
}
```

### Username

#### GET /username/check/:username

Check if username is available.

**Response:**
```json
{
  "available": boolean
}
```

#### POST /username/register

Register a username (requires auth).

**Request:**
```json
{
  "username": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "username": "string",
  "walletAddress": "string"
}
```

#### GET /username/resolve/:username

Resolve username to wallet address.

**Response:**
```json
{
  "username": "string",
  "walletAddress": "string",
  "user": { ... }
}
```

### Payments

#### POST /payment/create

Create a payment request (requires auth).

**Request:**
```json
{
  "receiverWallet": "string",
  "amount": "string",
  "sourceChain": "string",
  "destinationChain": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "senderWallet": "string",
  "receiverWallet": "string",
  "amount": "string",
  "status": "PENDING"
}
```

#### GET /payment/route

Get cross-chain payment route.

**Query Parameters:**
- fromChain
- toChain
- fromToken
- toToken
- fromAmount
- fromAddress
- toAddress

**Response:**
```json
{
  "fromChain": "string",
  "toChain": "string",
  "estimatedGas": "string",
  "estimatedTime": number
}
```

#### GET /payment/history

Get payment history (requires auth).

**Response:**
```json
[
  {
    "id": "string",
    "amount": "string",
    "status": "string",
    "createdAt": "string"
  }
]
```

#### GET /payment/:id

Get payment details by ID.

**Response:**
```json
{
  "id": "string",
  "senderWallet": "string",
  "receiverWallet": "string",
  "amount": "string",
  "status": "string",
  "transactions": []
}
```

## WebSocket Events

### Client → Server

- `subscribe:payment` - Subscribe to payment updates
- `subscribe:wallet` - Subscribe to wallet updates

### Server → Client

- `payment:update` - Payment status changed
- `wallet:update` - Wallet balance changed
