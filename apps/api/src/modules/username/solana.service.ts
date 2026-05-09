import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  connection,
  ghostRegistryProgram,
  getUsernameRegistryPDA,
  payer,
} from '../../config/solana';
import * as anchor from '@coral-xyz/anchor';

export class SolanaUsernameService {
  /**
   * Register a username on-chain
   */
  async registerUsername(username: string, userWallet: PublicKey) {
    const [registryPDA] = getUsernameRegistryPDA(username);

    try {
      const tx = await ghostRegistryProgram.methods
        .registerUsername(username)
        .accounts({
          registry: registryPDA,
          user: userWallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Username registered on-chain:', tx);
      return { signature: tx, registryPDA: registryPDA.toBase58() };
    } catch (error: any) {
      console.error('❌ Failed to register username on-chain:', error);
      throw new Error(`Blockchain registration failed: ${error.message}`);
    }
  }

  /**
   * Check if username exists on-chain
   */
  async checkUsernameOnChain(username: string): Promise<boolean> {
    const [registryPDA] = getUsernameRegistryPDA(username);

    try {
      const account = await ghostRegistryProgram.account.usernameRegistry.fetch(
        registryPDA
      );
      return !!account;
    } catch (error) {
      // Account doesn't exist
      return false;
    }
  }

  /**
   * Get username registry data from chain
   */
  async getUsernameRegistry(username: string) {
    const [registryPDA] = getUsernameRegistryPDA(username);

    try {
      const account = await ghostRegistryProgram.account.usernameRegistry.fetch(
        registryPDA
      );
      return {
        username: account.username,
        wallet: account.wallet.toBase58(),
        createdAt: account.createdAt.toNumber(),
        pda: registryPDA.toBase58(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update wallet address for a username
   */
  async updateWallet(
    username: string,
    currentWallet: PublicKey,
    newWallet: PublicKey
  ) {
    const [registryPDA] = getUsernameRegistryPDA(username);

    try {
      const tx = await ghostRegistryProgram.methods
        .updateWallet()
        .accounts({
          registry: registryPDA,
          wallet: currentWallet,
          newWallet: newWallet,
        })
        .rpc();

      console.log('✅ Wallet updated on-chain:', tx);
      return { signature: tx };
    } catch (error: any) {
      console.error('❌ Failed to update wallet on-chain:', error);
      throw new Error(`Blockchain update failed: ${error.message}`);
    }
  }

  /**
   * Close username registry (delete from chain)
   */
  async closeUsername(username: string, wallet: PublicKey) {
    const [registryPDA] = getUsernameRegistryPDA(username);

    try {
      const tx = await ghostRegistryProgram.methods
        .closeUsername()
        .accounts({
          registry: registryPDA,
          wallet: wallet,
        })
        .rpc();

      console.log('✅ Username closed on-chain:', tx);
      return { signature: tx };
    } catch (error: any) {
      console.error('❌ Failed to close username on-chain:', error);
      throw new Error(`Blockchain close failed: ${error.message}`);
    }
  }

  /**
   * Get all usernames for a wallet
   */
  async getUsernamesByWallet(wallet: PublicKey) {
    try {
      const accounts = await ghostRegistryProgram.account.usernameRegistry.all([
        {
          memcmp: {
            offset: 8 + 4 + 32, // discriminator + string length + username
            bytes: wallet.toBase58(),
          },
        },
      ]);

      return accounts.map((acc) => ({
        username: acc.account.username,
        wallet: acc.account.wallet.toBase58(),
        createdAt: acc.account.createdAt.toNumber(),
        pda: acc.publicKey.toBase58(),
      }));
    } catch (error) {
      console.error('Failed to fetch usernames by wallet:', error);
      return [];
    }
  }
}
