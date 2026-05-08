export interface User {
  id: string;
  walletAddress: string;
  username: string;
  createdAt: Date;
}

export interface PaymentRequest {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  receiverUsername?: string;
  amount: string;
  sourceChain: string;
  destinationChain: string;
  status: PaymentStatus;
  txHash?: string;
  destinationTxHash?: string;
  createdAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface UsernameRegistry {
  id: string;
  username: string;
  walletAddress: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  paymentRequestId: string;
  sourceTx?: string;
  destinationTx?: string;
  status: PaymentStatus;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaymentRoute {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedGas: string;
  estimatedTime: number;
}

// Extended types for web app

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface Chain {
  id: number;
  name: string;
  key: string;
  logoURI: string;
  nativeToken: Token;
}

export interface RouteQuote {
  fromChain: string;
  toChain: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  estimatedTime: number; // seconds
  steps: RouteStep[];
}

export interface RouteStep {
  type: 'swap' | 'bridge';
  protocol: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
}

// WebSocket Events

export interface PaymentUpdateEvent {
  paymentId: string;
  status: PaymentStatus;
  txHash?: string;
  destinationTxHash?: string;
  error?: string;
  timestamp: number;
}

// API Request/Response Types

export interface CreatePaymentRequest {
  senderWallet: string;
  receiverWallet: string;
  receiverUsername?: string;
  amount: string;
  sourceChain: string;
  destinationChain: string;
}

export interface RouteQuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
}

export interface UsernameAvailability {
  available: boolean;
  username: string;
}

// Error Types

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
}

