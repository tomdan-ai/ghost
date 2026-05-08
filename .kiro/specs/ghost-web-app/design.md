# Design Document: Ghost Web App

## Overview

The Ghost Web App is a Next.js 14 application using the App Router that provides a public-facing interface for Ghost Wallet. It enables cross-chain payments through shareable payment links, displays public user profiles, and facilitates wallet-based transactions that settle on Solana.

The application follows a modern React architecture with server-side rendering for public pages, client-side interactivity for payment flows, and real-time updates via WebSocket connections.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
├─────────────────────────────────────────────────────────────┤
│  App Router (RSC)          │  Client Components             │
│  - Landing page (/)        │  - Wallet connection           │
│  - Profile pages (/{user}) │  - Payment form                │
│  - Payment pages (/pay/*)  │  - Status tracker              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── Solana Wallet Adapter
                              │    (Phantom, Solflare, etc.)
                              │
                              ├─── React Query
                              │    (API data fetching)
                              │
                              ├─── Zustand
                              │    (Global state)
                              │
                              ├─── Socket.IO Client
                              │    (Real-time updates)
                              │
                              └─── LI.FI SDK
                                   (Cross-chain routing)
                                   
┌─────────────────────────────────────────────────────────────┐
│                     Backend API (Express)                    │
│  - User lookup                                              │
│  - Payment creation                                         │
│  - LI.FI integration                                        │
│  - WebSocket events                                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack React Query
- **Wallet**: Solana Wallet Adapter
- **Real-time**: Socket.IO Client
- **Cross-chain**: LI.FI SDK
- **QR Codes**: qrcode.react
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Components and Interfaces

### Page Components

#### 1. Landing Page (`app/page.tsx`)
Server component that renders the marketing homepage.

**Props**: None (static content)

**Sections**:
- Hero section with CTA
- Features showcase
- How it works
- Social proof
- Footer with links

#### 2. User Profile Page (`app/[username]/page.tsx`)
Server component that fetches and displays user profile.

**Props**:
```typescript
interface ProfilePageProps {
  params: { username: string }
}
```

**Data Fetching**:
- Fetch user from API: `GET /api/users/{username}`
- Generate QR code for payment link
- Display wallet address and creation date

#### 3. Payment Link Page (`app/pay/[username]/[[amount]]/page.tsx`)
Client component for payment interface.

**Props**:
```typescript
interface PaymentPageProps {
  params: { 
    username: string
    amount?: string 
  }
}
```

**Features**:
- Wallet connection
- Chain selection
- Token selection
- Amount input (pre-filled if in URL)
- LI.FI route quote
- Transaction execution
- Status tracking

#### 4. Payment Status Page (`app/payment/[id]/page.tsx`)
Client component for real-time payment tracking.

**Props**:
```typescript
interface StatusPageProps {
  params: { id: string }
}
```

**Features**:
- WebSocket connection for updates
- Progress indicator
- Transaction links
- Status messages

### Feature Components

#### WalletConnect Component
```typescript
interface WalletConnectProps {
  onConnect?: (publicKey: PublicKey) => void
  onDisconnect?: () => void
}
```

Handles Solana wallet connection using Wallet Adapter.

#### PaymentForm Component
```typescript
interface PaymentFormProps {
  receiverUsername: string
  receiverWallet: string
  prefilledAmount?: string
}
```

Main payment interface with chain/token selection and amount input.

#### ChainSelector Component
```typescript
interface ChainSelectorProps {
  selectedChain: string
  onChainChange: (chain: string) => void
  supportedChains: Chain[]
}
```

Dropdown for selecting source blockchain.

#### TokenSelector Component
```typescript
interface TokenSelectorProps {
  chain: string
  selectedToken: string
  onTokenChange: (token: string) => void
}
```

Dropdown for selecting token on chosen chain.

#### RouteQuote Component
```typescript
interface RouteQuoteProps {
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  amount: string
  fromAddress: string
}
```

Displays LI.FI route quote with fees and estimated time.

#### PaymentStatus Component
```typescript
interface PaymentStatusProps {
  paymentId: string
  initialStatus?: PaymentStatus
}
```

Real-time status display with WebSocket updates.

#### QRCodeDisplay Component
```typescript
interface QRCodeDisplayProps {
  url: string
  size?: number
  downloadable?: boolean
}
```

Generates and displays QR code for payment links.

### Shared Components

#### Button, Input, Card, Badge
Using shadcn/ui components for consistent UI.

#### LoadingSpinner
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}
```

#### ErrorMessage
```typescript
interface ErrorMessageProps {
  title: string
  message: string
  retry?: () => void
}
```

## Data Models

### Frontend Types

```typescript
// User
interface User {
  id: string
  username: string
  walletAddress: string
  createdAt: string
}

// Payment Request
interface PaymentRequest {
  id: string
  senderWallet: string
  receiverWallet: string
  receiverUsername: string
  amount: string
  sourceChain: string
  destinationChain: string
  status: PaymentStatus
  txHash?: string
  createdAt: string
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// LI.FI Route
interface RouteQuote {
  fromChain: string
  toChain: string
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  estimatedGas: string
  estimatedTime: number // seconds
  steps: RouteStep[]
}

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

interface RouteStep {
  type: 'swap' | 'bridge'
  protocol: string
  fromToken: Token
  toToken: Token
}

// Chain
interface Chain {
  id: number
  name: string
  logoURI: string
  nativeToken: Token
}

// WebSocket Events
interface PaymentUpdateEvent {
  paymentId: string
  status: PaymentStatus
  txHash?: string
  destinationTxHash?: string
  error?: string
}
```

### State Management (Zustand)

```typescript
interface WalletStore {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

interface PaymentStore {
  currentPayment: PaymentRequest | null
  setCurrentPayment: (payment: PaymentRequest) => void
  clearCurrentPayment: () => void
}
```

### API Client

```typescript
class GhostAPIClient {
  // User endpoints
  async getUser(username: string): Promise<User>
  async checkUsername(username: string): Promise<{ available: boolean }>
  
  // Payment endpoints
  async createPayment(data: CreatePaymentRequest): Promise<PaymentRequest>
  async getPayment(id: string): Promise<PaymentRequest>
  async getPaymentHistory(walletAddress: string): Promise<PaymentRequest[]>
  
  // LI.FI endpoints
  async getRouteQuote(params: RouteQuoteParams): Promise<RouteQuote>
  async getSupportedChains(): Promise<Chain[]>
  async getSupportedTokens(chainId: number): Promise<Token[]>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Username Resolution Consistency
*For any* valid username, fetching the user profile should return the same wallet address as fetching through the payment link page.

**Validates: Requirements 2.1, 3.1**

### Property 2: Amount Pre-fill Accuracy
*For any* payment link with an amount parameter `/pay/{username}/{amount}`, the payment form should display exactly that amount in the input field.

**Validates: Requirements 2.2**

### Property 3: Wallet Connection Persistence
*For any* wallet connection session, refreshing the page should maintain the connection state if the wallet is still authorized.

**Validates: Requirements 4.7**

### Property 4: QR Code URL Encoding
*For any* payment link URL, the generated QR code should decode to exactly that URL when scanned.

**Validates: Requirements 7.2, 7.5**

### Property 5: Route Quote Consistency
*For any* set of payment parameters (chain, token, amount), requesting a route quote multiple times within 30 seconds should return equivalent routes (same protocols and similar amounts within 1% slippage).

**Validates: Requirements 5.2, 5.3**

### Property 6: Payment Status Progression
*For any* payment, the status should only transition in valid sequences: PENDING → PROCESSING → COMPLETED or PENDING → PROCESSING → FAILED. No other transitions are valid.

**Validates: Requirements 6.2, 6.6**

### Property 7: WebSocket Update Delivery
*For any* payment status change, all connected clients subscribed to that payment should receive the update event within 5 seconds.

**Validates: Requirements 6.5, 6.6**

### Property 8: Error Message Display
*For any* API error response, the UI should display a user-friendly error message (not raw error codes or stack traces).

**Validates: Requirements 9.1, 9.2, 9.3, 9.6**

### Property 9: Responsive Layout Integrity
*For any* page, when viewed at screen widths of 320px, 768px, and 1024px, all interactive elements should remain accessible and clickable.

**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

### Property 10: Meta Tag Generation
*For any* user profile page, the generated HTML should contain Open Graph and Twitter Card meta tags with the username and wallet address.

**Validates: Requirements 11.2, 11.3**

## Error Handling

### Error Categories

1. **Network Errors**
   - API request failures
   - WebSocket disconnections
   - Timeout errors
   - Display: "Connection issue. Please check your internet and try again."

2. **Wallet Errors**
   - Connection rejected
   - Transaction rejected
   - Insufficient balance
   - Display: Specific wallet error with suggested action

3. **Validation Errors**
   - Invalid username format
   - Invalid amount
   - Unsupported chain/token
   - Display: Inline form validation messages

4. **Payment Errors**
   - Route not found
   - Bridge failure
   - Transaction failed
   - Display: Error page with transaction details and retry option

5. **Not Found Errors**
   - Username doesn't exist
   - Payment ID not found
   - Display: Custom 404 page with search/navigation options

### Error Handling Strategy

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  // Catches React errors
  // Logs to console
  // Displays fallback UI
}

// API error handler
function handleAPIError(error: Error): UserFriendlyError {
  // Map error codes to messages
  // Log for debugging
  // Return user-friendly message
}

// Wallet error handler
function handleWalletError(error: WalletError): string {
  // Parse wallet-specific errors
  // Provide actionable guidance
}
```

### Retry Logic

- Network errors: Automatic retry with exponential backoff (3 attempts)
- WebSocket disconnections: Automatic reconnection
- User-initiated retries: Manual retry button for failed payments

## Testing Strategy

### Unit Tests

**Components to Test**:
- PaymentForm validation logic
- ChainSelector/TokenSelector state management
- QRCodeDisplay generation
- RouteQuote calculation display
- PaymentStatus state transitions

**Test Framework**: Vitest + React Testing Library

**Example Tests**:
```typescript
describe('PaymentForm', () => {
  it('validates amount input correctly', () => {
    // Test positive numbers, decimals, zero, negative
  })
  
  it('disables submit when wallet not connected', () => {
    // Test button state
  })
  
  it('pre-fills amount from props', () => {
    // Test amount parameter
  })
})
```

### Integration Tests

**Flows to Test**:
- Complete payment flow (wallet connect → form fill → quote → submit)
- Profile page data fetching
- WebSocket connection and updates
- Error handling and recovery

**Test Framework**: Playwright

**Example Tests**:
```typescript
test('complete payment flow', async ({ page }) => {
  await page.goto('/pay/alice/10')
  await page.click('[data-testid="connect-wallet"]')
  // ... complete flow
  await expect(page.locator('[data-testid="status"]')).toContainText('COMPLETED')
})
```

### Property-Based Tests

**Properties to Test**:
- Username resolution consistency
- QR code encoding/decoding
- Payment status transitions
- Responsive layout integrity

**Test Framework**: fast-check

**Example Tests**:
```typescript
import fc from 'fast-check'

test('Property 2: Amount pre-fill accuracy', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3, maxLength: 32 }), // username
      fc.double({ min: 0.01, max: 1000000 }), // amount
      (username, amount) => {
        const url = `/pay/${username}/${amount}`
        // Navigate to URL
        // Check input value === amount
        return inputValue === amount.toString()
      }
    ),
    { numRuns: 100 }
  )
})
```

### End-to-End Tests

**Critical Paths**:
- Landing page → payment link → complete payment
- Profile page → payment link
- Error scenarios (invalid username, failed transaction)

**Test Environment**: Staging with test wallets and devnet

## Performance Optimization

### Next.js Optimizations

1. **Server-Side Rendering**
   - Landing page (static)
   - Profile pages (dynamic with ISR)
   - SEO-critical pages

2. **Client-Side Rendering**
   - Payment forms (interactive)
   - Status pages (real-time)

3. **Image Optimization**
   - Use Next.js Image component
   - Lazy load below-the-fold images
   - Serve WebP format

4. **Code Splitting**
   - Route-based splitting (automatic)
   - Dynamic imports for heavy components (LI.FI SDK, QR generator)

5. **Caching**
   - API responses (React Query with stale-while-revalidate)
   - Static assets (CDN)
   - User profiles (ISR with 60s revalidation)

### Bundle Size Optimization

- Tree-shake unused code
- Use dynamic imports for:
  - Wallet adapters (load on demand)
  - QR code library (load when needed)
  - LI.FI SDK (load on payment page)

### Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Lighthouse Score**: > 90

## SEO and Metadata

### Dynamic Meta Tags

```typescript
// app/[username]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const user = await getUser(params.username)
  
  return {
    title: `${user.username} - Ghost Wallet`,
    description: `Send payments to ${user.username} on Ghost Wallet`,
    openGraph: {
      title: `Pay ${user.username}`,
      description: 'Send cross-chain payments instantly',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Pay ${user.username}`,
      description: 'Send cross-chain payments instantly',
    },
  }
}
```

### Sitemap Generation

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const users = await getAllUsers()
  
  return [
    { url: 'https://ghost.app', priority: 1 },
    ...users.map(user => ({
      url: `https://ghost.app/${user.username}`,
      lastModified: user.createdAt,
      priority: 0.8,
    })),
  ]
}
```

## Deployment

### Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.ghost.app
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_LIFI_API_KEY=xxx
NEXT_PUBLIC_ANALYTICS_ID=xxx
```

### Build Process

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Start production server
pnpm start
```

### Hosting

- **Platform**: Vercel (recommended for Next.js)
- **CDN**: Automatic via Vercel
- **SSL**: Automatic via Vercel
- **Domain**: ghost.app

### Monitoring

- **Analytics**: Vercel Analytics or Plausible
- **Error Tracking**: Sentry
- **Performance**: Vercel Speed Insights
- **Uptime**: Vercel monitoring

## Security Considerations

1. **Wallet Security**
   - Never request private keys
   - Only request transaction signatures
   - Validate all transaction data before signing

2. **API Security**
   - CORS configured for ghost.app domain
   - Rate limiting on API endpoints
   - Input validation on all forms

3. **XSS Prevention**
   - React's built-in XSS protection
   - Sanitize user-generated content
   - CSP headers configured

4. **CSRF Protection**
   - Not needed (no cookies/sessions)
   - Wallet signatures provide authentication

5. **Data Privacy**
   - No PII stored in frontend
   - Analytics anonymized
   - GDPR-compliant cookie consent
