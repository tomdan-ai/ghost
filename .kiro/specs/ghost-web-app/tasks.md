# Implementation Plan: Ghost Web App

## Overview

This plan breaks down the Ghost Web App implementation into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early.

## Tasks

- [ ] 1. Setup project foundation and dependencies
  - Install and configure Next.js 14 with App Router
  - Setup TailwindCSS and PostCSS
  - Install shadcn/ui and configure components
  - Setup TypeScript strict mode
  - Configure ESLint and Prettier
  - _Requirements: All (foundation for entire app)_

- [ ] 2. Create shared types and API client
  - [ ] 2.1 Define TypeScript interfaces in `packages/shared-types`
    - User, PaymentRequest, PaymentStatus enum
    - RouteQuote, Token, Chain interfaces
    - WebSocket event types
    - _Requirements: 2.1, 3.1, 5.1, 6.2_
  
  - [ ] 2.2 Create API client class
    - Implement getUser, checkUsername methods
    - Implement createPayment, getPayment methods
    - Implement getRouteQuote, getSupportedChains methods
    - Add error handling and type safety
    - _Requirements: 2.1, 3.1, 5.2_
  
  - [ ]* 2.3 Write unit tests for API client
    - Test successful responses
    - Test error handling
    - Test request parameter validation
    - _Requirements: 2.1, 3.1, 5.2_

- [ ] 3. Setup state management and providers
  - [ ] 3.1 Create Zustand stores
    - WalletStore (publicKey, connected, connect/disconnect)
    - PaymentStore (currentPayment, setters)
    - _Requirements: 4.5, 4.6, 4.8_
  
  - [ ] 3.2 Setup React Query provider
    - Configure QueryClient with defaults
    - Add stale-while-revalidate caching
    - Setup error handling
    - _Requirements: 10.6_
  
  - [ ] 3.3 Setup Solana Wallet Adapter
    - Configure supported wallets (Phantom, Solflare)
    - Create WalletProvider wrapper
    - Add connection persistence
    - _Requirements: 4.1, 4.2, 4.3, 4.7_
  
  - [ ]* 3.4 Write property test for wallet persistence
    - **Property 3: Wallet Connection Persistence**
    - **Validates: Requirements 4.7**

- [ ] 4. Build core UI components
  - [ ] 4.1 Create base components using shadcn/ui
    - Button, Input, Card, Badge components
    - LoadingSpinner component
    - ErrorMessage component
    - _Requirements: 8.1, 8.2, 8.3, 9.1_
  
  - [ ] 4.2 Create WalletConnect component
    - Wallet selection modal
    - Connect/disconnect buttons
    - Display connected wallet address
    - Display wallet balance
    - _Requirements: 4.4, 4.5, 4.6, 4.8_
  
  - [ ]* 4.3 Write unit tests for WalletConnect
    - Test wallet connection flow
    - Test disconnect functionality
    - Test error states
    - _Requirements: 4.4, 4.5, 4.6, 4.8_

- [ ] 5. Implement landing page
  - [ ] 5.1 Create landing page layout
    - Hero section with headline and CTA
    - Features section with icons
    - How it works section
    - Footer with links
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 5.2 Add responsive design
    - Mobile-first styling
    - Tablet breakpoints
    - Desktop layout
    - _Requirements: 1.6, 8.1, 8.2, 8.3_
  
  - [ ] 5.3 Optimize performance
    - Use Next.js Image component
    - Implement lazy loading
    - Add meta tags for SEO
    - _Requirements: 1.7, 10.1, 10.2, 11.1_

- [ ] 6. Build user profile pages
  - [ ] 6.1 Create profile page component
    - Fetch user data from API
    - Display username and wallet address
    - Show account creation date
    - Add "Pay" button linking to payment page
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [ ] 6.2 Add QR code generation
    - Install qrcode.react library
    - Generate QR for payment link
    - Add download functionality
    - _Requirements: 3.5, 7.1, 7.2, 7.4, 7.6_
  
  - [ ] 6.3 Implement 404 handling
    - Create custom 404 page
    - Handle non-existent usernames
    - Add search/navigation options
    - _Requirements: 3.7, 9.4_
  
  - [ ] 6.4 Add dynamic meta tags
    - Generate Open Graph tags
    - Generate Twitter Card tags
    - Add canonical URLs
    - _Requirements: 11.2, 11.3, 11.5_
  
  - [ ]* 6.5 Write property test for username resolution
    - **Property 1: Username Resolution Consistency**
    - **Validates: Requirements 2.1, 3.1**
  
  - [ ]* 6.6 Write property test for meta tag generation
    - **Property 10: Meta Tag Generation**
    - **Validates: Requirements 11.2, 11.3**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement payment form components
  - [ ] 8.1 Create ChainSelector component
    - Fetch supported chains from API
    - Display chain logos and names
    - Handle chain selection
    - _Requirements: 2.6, 5.1_
  
  - [ ] 8.2 Create TokenSelector component
    - Fetch tokens for selected chain
    - Display token logos and symbols
    - Handle token selection
    - _Requirements: 2.7, 5.1_
  
  - [ ] 8.3 Create amount input with validation
    - Numeric input with decimals
    - Min/max validation
    - Format display
    - _Requirements: 2.8_
  
  - [ ] 8.4 Create RouteQuote component
    - Fetch quote from LI.FI
    - Display estimated output amount
    - Display gas fees
    - Display estimated time
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 8.5 Write unit tests for form components
    - Test chain/token selection
    - Test amount validation
    - Test quote display
    - _Requirements: 2.6, 2.7, 2.8, 5.2_

- [ ] 9. Build payment link pages
  - [ ] 9.1 Create payment page component
    - Parse username and optional amount from URL
    - Fetch receiver user data
    - Display receiver info prominently
    - Integrate WalletConnect component
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [ ] 9.2 Integrate PaymentForm
    - Add ChainSelector, TokenSelector, amount input
    - Pre-fill amount if in URL
    - Add RouteQuote display
    - Add submit button
    - _Requirements: 2.6, 2.7, 2.8, 2.9_
  
  - [ ] 9.3 Add QR code for mobile
    - Generate QR for current payment link
    - Display prominently for mobile users
    - _Requirements: 2.10, 7.1, 7.2, 7.3_
  
  - [ ] 9.4 Handle error states
    - Username not found
    - Invalid amount
    - Network errors
    - _Requirements: 2.3, 9.1, 9.4_
  
  - [ ]* 9.5 Write property test for amount pre-fill
    - **Property 2: Amount Pre-fill Accuracy**
    - **Validates: Requirements 2.2**
  
  - [ ]* 9.6 Write property test for QR code encoding
    - **Property 4: QR Code URL Encoding**
    - **Validates: Requirements 7.2, 7.5**

- [ ] 10. Implement payment execution flow
  - [ ] 10.1 Create payment submission handler
    - Validate form data
    - Create payment request in backend
    - Get LI.FI route
    - Prepare transaction
    - _Requirements: 5.6, 5.9_
  
  - [ ] 10.2 Integrate wallet transaction signing
    - Prompt user to sign transaction
    - Handle signature approval/rejection
    - Submit signed transaction
    - _Requirements: 5.7, 5.8_
  
  - [ ] 10.3 Handle transaction errors
    - Wallet rejection
    - Insufficient balance
    - Network failures
    - _Requirements: 9.2, 9.3_
  
  - [ ]* 10.4 Write integration test for payment flow
    - Test complete flow from form to submission
    - Test error handling
    - _Requirements: 5.6, 5.7, 5.8, 5.9_

- [ ] 11. Build payment status tracking
  - [ ] 11.1 Create PaymentStatus component
    - Display current status
    - Show progress indicator
    - Display transaction hashes with links
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 11.2 Setup WebSocket connection
    - Connect to Socket.IO server
    - Subscribe to payment updates
    - Handle connection/disconnection
    - _Requirements: 6.5_
  
  - [ ] 11.3 Implement real-time updates
    - Listen for status change events
    - Update UI without page refresh
    - Display progress percentage
    - _Requirements: 6.5, 6.6, 6.7_
  
  - [ ] 11.4 Add completion handling
    - Display success message
    - Show final transaction details
    - Add "Make another payment" button
    - _Requirements: 6.8_
  
  - [ ]* 11.5 Write property test for status transitions
    - **Property 6: Payment Status Progression**
    - **Validates: Requirements 6.2, 6.6**
  
  - [ ]* 11.6 Write property test for WebSocket delivery
    - **Property 7: WebSocket Update Delivery**
    - **Validates: Requirements 6.5, 6.6**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement responsive design
  - [ ] 13.1 Add mobile breakpoints
    - Test all pages at 320px-767px
    - Adjust layouts for mobile
    - Simplify navigation
    - _Requirements: 8.1, 8.5_
  
  - [ ] 13.2 Add tablet breakpoints
    - Test all pages at 768px-1023px
    - Optimize layouts for tablet
    - _Requirements: 8.2_
  
  - [ ] 13.3 Add desktop breakpoints
    - Test all pages at 1024px+
    - Optimize layouts for desktop
    - _Requirements: 8.3_
  
  - [ ]* 13.4 Write property test for responsive layout
    - **Property 9: Responsive Layout Integrity**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

- [ ] 14. Add error handling and validation
  - [ ] 14.1 Create global error boundary
    - Catch React errors
    - Display fallback UI
    - Log errors to console
    - _Requirements: 9.5_
  
  - [ ] 14.2 Implement API error handling
    - Map error codes to messages
    - Display user-friendly errors
    - Add retry functionality
    - _Requirements: 9.1, 9.6_
  
  - [ ] 14.3 Add form validation
    - Username format validation
    - Amount validation
    - Chain/token validation
    - _Requirements: 9.3_
  
  - [ ]* 14.4 Write property test for error messages
    - **Property 8: Error Message Display**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.6**

- [ ] 15. Optimize performance
  - [ ] 15.1 Implement code splitting
    - Dynamic import for LI.FI SDK
    - Dynamic import for QR code library
    - Dynamic import for wallet adapters
    - _Requirements: 10.3, 10.4_
  
  - [ ] 15.2 Add image optimization
    - Use Next.js Image component
    - Lazy load images
    - Serve WebP format
    - _Requirements: 10.2_
  
  - [ ] 15.3 Configure caching
    - React Query cache settings
    - ISR for profile pages
    - Static asset caching
    - _Requirements: 10.6_
  
  - [ ] 15.4 Optimize bundle size
    - Tree-shake unused code
    - Analyze bundle with webpack-bundle-analyzer
    - Remove duplicate dependencies
    - _Requirements: 10.1_
  
  - [ ]* 15.5 Run Lighthouse audit
    - Achieve performance score > 90
    - Verify LCP < 2.5s
    - Verify CLS < 0.1
    - _Requirements: 10.1_

- [ ] 16. Add SEO and metadata
  - [ ] 16.1 Generate sitemap
    - Fetch all users
    - Create sitemap.xml
    - Include priority and lastModified
    - _Requirements: 11.4_
  
  - [ ] 16.2 Add robots.txt
    - Allow all pages
    - Link to sitemap
    - _Requirements: 11.4_
  
  - [ ] 16.3 Implement dynamic meta tags
    - Page titles for all routes
    - Open Graph tags for profiles
    - Twitter Card tags for profiles
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

- [ ] 17. Add analytics and monitoring
  - [ ] 17.1 Setup analytics tracking
    - Track page views
    - Track payment initiation
    - Track payment completion
    - Track wallet connections
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 17.2 Add error tracking
    - Track error events
    - Log to monitoring service
    - _Requirements: 12.5_
  
  - [ ] 17.3 Implement privacy compliance
    - Add cookie consent banner
    - Anonymize analytics data
    - GDPR/CCPA compliance
    - _Requirements: 12.6, 12.7_

- [ ] 18. Write end-to-end tests
  - [ ]* 18.1 Test landing to payment flow
    - Navigate from landing page
    - Complete payment
    - Verify success
    - _Requirements: 1.1, 2.1, 5.6_
  
  - [ ]* 18.2 Test profile to payment flow
    - Navigate to profile
    - Click pay button
    - Complete payment
    - _Requirements: 3.1, 3.4, 2.1_
  
  - [ ]* 18.3 Test error scenarios
    - Invalid username
    - Failed transaction
    - Network errors
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Deployment preparation
  - [ ] 20.1 Configure environment variables
    - Setup production env vars
    - Add API URLs
    - Add RPC endpoints
    - _Requirements: All_
  
  - [ ] 20.2 Setup Vercel deployment
    - Connect GitHub repository
    - Configure build settings
    - Setup custom domain
    - _Requirements: All_
  
  - [ ] 20.3 Configure monitoring
    - Setup Vercel Analytics
    - Setup error tracking
    - Setup uptime monitoring
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration and E2E tests validate complete user flows
