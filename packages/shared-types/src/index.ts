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
  amount: string;
  sourceChain: string;
  destinationChain: string;
  status: PaymentStatus;
  txHash?: string;
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
