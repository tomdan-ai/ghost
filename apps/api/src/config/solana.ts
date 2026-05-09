import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import idl from '../ghost_registry.json';
import bs58 from 'bs58';

// Program ID from your deployed contract
export const GHOST_REGISTRY_PROGRAM_ID = new PublicKey(
  '5v95TCKx8XvdXKnGjFQUumdNwdAuM6prvcYx6YfZxBKH'
);

// Lazy-loaded instances
let connectionInstance: Connection | null = null;
let payerKeypair: Keypair | null = null;
let providerInstance: AnchorProvider | null = null;
let programInstance: Program | null = null;

// Solana connection (lazy-loaded)
export const getConnection = () => {
  if (!connectionInstance) {
    connectionInstance = new Connection(
      process.env.SOLANA_RPC_URL || 'http://localhost:8899',
      'confirmed'
    );
  }
  return connectionInstance;
};

// Load payer keypair from environment (lazy-loaded)
export const getPayer = () => {
  if (!payerKeypair) {
    try {
      const privateKey = process.env.SOLANA_PAYER_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('SOLANA_PAYER_PRIVATE_KEY not set');
      }
      payerKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      console.log('✅ Solana payer keypair loaded:', payerKeypair.publicKey.toBase58());
    } catch (error) {
      console.warn('⚠️  Solana payer keypair not configured. Some features will be unavailable.');
      // Create a dummy keypair for development
      payerKeypair = Keypair.generate();
    }
  }
  return payerKeypair;
};

// Create Anchor provider (lazy-loaded)
export const getProvider = () => {
  if (!providerInstance) {
    const wallet = new Wallet(getPayer());
    providerInstance = new AnchorProvider(getConnection(), wallet, {
      commitment: 'confirmed',
    });
  }
  return providerInstance;
};

// Get Anchor program (lazy-loaded)
export const getGhostRegistryProgram = () => {
  if (!programInstance) {
    programInstance = new Program(
      idl as any,
      GHOST_REGISTRY_PROGRAM_ID,
      getProvider()
    );
  }
  return programInstance;
};

// Backward compatibility exports
export const connection = new Proxy({} as Connection, {
  get: (target, prop) => {
    return (getConnection() as any)[prop];
  }
});

export const payer = new Proxy({} as Keypair, {
  get: (target, prop) => {
    return (getPayer() as any)[prop];
  }
});

export const provider = new Proxy({} as AnchorProvider, {
  get: (target, prop) => {
    return (getProvider() as any)[prop];
  }
});

export const ghostRegistryProgram = new Proxy({} as Program, {
  get: (target, prop) => {
    return (getGhostRegistryProgram() as any)[prop];
  }
});

// Helper to derive username registry PDA
export function getUsernameRegistryPDA(username: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('registry'), Buffer.from(username)],
    GHOST_REGISTRY_PROGRAM_ID
  );
}

// Helper to derive payment reference PDA
export function getPaymentReferencePDA(
  username: string,
  paymentId: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('payment'),
      Buffer.from(username),
      Buffer.from(paymentId),
    ],
    GHOST_REGISTRY_PROGRAM_ID
  );
}
