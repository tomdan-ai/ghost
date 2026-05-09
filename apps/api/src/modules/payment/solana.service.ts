import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  connection,
  ghostRegistryProgram,
  getPaymentReferencePDA,
  getUsernameRegistryPDA,
} from '../../config/solana';

export enum PaymentStatus {
  Pending = 'Pending',
  Claimed = 'Claimed',
  Cancelled = 'Cancelled',
}

export interface PaymentReferenceData {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  sourceChain: string;
  status: PaymentStatus;
  createdAt: number;
  pda: string;
}

export class SolanaPaymentService {
  /**
   * Create a payment reference on-chain
   */
  async createPaymentReference(
    username: string,
    paymentId: string,
    amount: number,
    sourceChain: string,
    payerWallet: PublicKey
  ) {
    const [registryPDA] = getUsernameRegistryPDA(username);
    const [referencePDA] = getPaymentReferencePDA(username, paymentId);

    try {
      const tx = await ghostRegistryProgram.methods
        .createPaymentReference(paymentId, amount, sourceChain)
        .accounts({
          reference: referencePDA,
          registry: registryPDA,
          payer: payerWallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Payment reference created on-chain:', tx);
      return {
        signature: tx,
        referencePDA: referencePDA.toBase58(),
      };
    } catch (error: any) {
      console.error('❌ Failed to create payment reference:', error);
      throw new Error(`Blockchain payment creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment reference data from chain
   */
  async getPaymentReference(
    username: string,
    paymentId: string
  ): Promise<PaymentReferenceData | null> {
    const [referencePDA] = getPaymentReferencePDA(username, paymentId);

    try {
      const account = await ghostRegistryProgram.account.paymentReference.fetch(
        referencePDA
      );

      return {
        id: account.id,
        sender: account.sender.toBase58(),
        receiver: account.receiver.toBase58(),
        amount: account.amount.toNumber(),
        sourceChain: account.sourceChain,
        status: this.mapStatus(account.status),
        createdAt: account.createdAt.toNumber(),
        pda: referencePDA.toBase58(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Claim a payment reference
   */
  async claimPaymentReference(
    username: string,
    paymentId: string,
    authorityWallet: PublicKey
  ) {
    const [registryPDA] = getUsernameRegistryPDA(username);
    const [referencePDA] = getPaymentReferencePDA(username, paymentId);

    try {
      const tx = await ghostRegistryProgram.methods
        .claimPaymentReference(paymentId)
        .accounts({
          reference: referencePDA,
          registry: registryPDA,
          authority: authorityWallet,
        })
        .rpc();

      console.log('✅ Payment reference claimed on-chain:', tx);
      return { signature: tx };
    } catch (error: any) {
      console.error('❌ Failed to claim payment reference:', error);
      throw new Error(`Blockchain claim failed: ${error.message}`);
    }
  }

  /**
   * Cancel a payment reference
   */
  async cancelPaymentReference(
    username: string,
    paymentId: string,
    authorityWallet: PublicKey
  ) {
    const [registryPDA] = getUsernameRegistryPDA(username);
    const [referencePDA] = getPaymentReferencePDA(username, paymentId);

    try {
      const tx = await ghostRegistryProgram.methods
        .cancelPaymentReference(paymentId)
        .accounts({
          reference: referencePDA,
          registry: registryPDA,
          authority: authorityWallet,
        })
        .rpc();

      console.log('✅ Payment reference cancelled on-chain:', tx);
      return { signature: tx };
    } catch (error: any) {
      console.error('❌ Failed to cancel payment reference:', error);
      throw new Error(`Blockchain cancel failed: ${error.message}`);
    }
  }

  /**
   * Get all payment references for a username
   */
  async getPaymentsByUsername(username: string): Promise<PaymentReferenceData[]> {
    try {
      // Get all payment references that match the username pattern
      const accounts = await ghostRegistryProgram.account.paymentReference.all();

      // Filter by username (checking the PDA derivation)
      const filtered = accounts.filter((acc) => {
        const [expectedPDA] = getPaymentReferencePDA(username, acc.account.id);
        return acc.publicKey.equals(expectedPDA);
      });

      return filtered.map((acc) => ({
        id: acc.account.id,
        sender: acc.account.sender.toBase58(),
        receiver: acc.account.receiver.toBase58(),
        amount: acc.account.amount.toNumber(),
        sourceChain: acc.account.sourceChain,
        status: this.mapStatus(acc.account.status),
        createdAt: acc.account.createdAt.toNumber(),
        pda: acc.publicKey.toBase58(),
      }));
    } catch (error) {
      console.error('Failed to fetch payments by username:', error);
      return [];
    }
  }

  /**
   * Get payment references by sender
   */
  async getPaymentsBySender(senderWallet: PublicKey): Promise<PaymentReferenceData[]> {
    try {
      const accounts = await ghostRegistryProgram.account.paymentReference.all([
        {
          memcmp: {
            offset: 8 + 4 + 64, // discriminator + string length + id
            bytes: senderWallet.toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        id: acc.account.id,
        sender: acc.account.sender.toBase58(),
        receiver: acc.account.receiver.toBase58(),
        amount: acc.account.amount.toNumber(),
        sourceChain: acc.account.sourceChain,
        status: this.mapStatus(acc.account.status),
        createdAt: acc.account.createdAt.toNumber(),
        pda: acc.publicKey.toBase58(),
      }));
    } catch (error) {
      console.error('Failed to fetch payments by sender:', error);
      return [];
    }
  }

  /**
   * Get payment references by receiver
   */
  async getPaymentsByReceiver(receiverWallet: PublicKey): Promise<PaymentReferenceData[]> {
    try {
      const accounts = await ghostRegistryProgram.account.paymentReference.all([
        {
          memcmp: {
            offset: 8 + 4 + 64 + 32, // discriminator + string + id + sender
            bytes: receiverWallet.toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        id: acc.account.id,
        sender: acc.account.sender.toBase58(),
        receiver: acc.account.receiver.toBase58(),
        amount: acc.account.amount.toNumber(),
        sourceChain: acc.account.sourceChain,
        status: this.mapStatus(acc.account.status),
        createdAt: acc.account.createdAt.toNumber(),
        pda: acc.publicKey.toBase58(),
      }));
    } catch (error) {
      console.error('Failed to fetch payments by receiver:', error);
      return [];
    }
  }

  /**
   * Map on-chain status to enum
   */
  private mapStatus(status: any): PaymentStatus {
    if (status.pending) return PaymentStatus.Pending;
    if (status.claimed) return PaymentStatus.Claimed;
    if (status.cancelled) return PaymentStatus.Cancelled;
    return PaymentStatus.Pending;
  }
}
