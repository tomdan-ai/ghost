import { PublicKey } from '@solana/web3.js';
import { prisma } from '../../config/database';
import { SolanaUsernameService } from './solana.service';

const solanaService = new SolanaUsernameService();

export class UsernameService {
  /**
   * Check username availability (checks both DB and blockchain)
   */
  async checkAvailability(username: string): Promise<boolean> {
    // Check database
    const existingInDb = await prisma.usernameRegistry.findUnique({
      where: { username },
    });
    
    if (existingInDb) {
      return false;
    }

    // Check blockchain
    const existsOnChain = await solanaService.checkUsernameOnChain(username);
    return !existsOnChain;
  }

  /**
   * Register username (both on-chain and in database)
   */
  async register(username: string, walletAddress: string, userId: string) {
    // Validate username format
    if (username.length < 3 || username.length > 32) {
      throw new Error('Username must be between 3 and 32 characters');
    }

    // Check availability
    const isAvailable = await this.checkAvailability(username);
    if (!isAvailable) {
      throw new Error('Username already taken');
    }

    try {
      const userWallet = new PublicKey(walletAddress);

      // Register on blockchain first
      const { signature, registryPDA } = await solanaService.registerUsername(
        username,
        userWallet
      );

      // Then save to database
      const registry = await prisma.usernameRegistry.create({
        data: {
          username,
          walletAddress,
          userId,
          onChainAddress: registryPDA,
          registrationTx: signature,
        },
      });

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: { username },
      });

      return {
        ...registry,
        blockchainSignature: signature,
      };
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(`Failed to register username: ${error.message}`);
    }
  }

  /**
   * Resolve username to user data
   */
  async resolve(username: string) {
    // Try database first (faster)
    const dbResult = await prisma.usernameRegistry.findUnique({
      where: { username },
      include: { user: true },
    });

    if (dbResult) {
      return dbResult;
    }

    // Fallback to blockchain
    const chainData = await solanaService.getUsernameRegistry(username);
    if (chainData) {
      return {
        username: chainData.username,
        walletAddress: chainData.wallet,
        onChainAddress: chainData.pda,
        createdAt: new Date(chainData.createdAt * 1000),
      };
    }

    return null;
  }

  /**
   * Get username by wallet address
   */
  async getByWallet(walletAddress: string) {
    // Check database
    const dbResult = await prisma.usernameRegistry.findUnique({
      where: { walletAddress },
    });

    if (dbResult) {
      return dbResult;
    }

    // Check blockchain
    try {
      const userWallet = new PublicKey(walletAddress);
      const chainUsernames = await solanaService.getUsernamesByWallet(userWallet);
      return chainUsernames[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Sync blockchain data to database
   */
  async syncFromBlockchain(username: string) {
    const chainData = await solanaService.getUsernameRegistry(username);
    
    if (!chainData) {
      throw new Error('Username not found on blockchain');
    }

    // Update or create in database
    const existing = await prisma.usernameRegistry.findUnique({
      where: { username },
    });

    if (existing) {
      return await prisma.usernameRegistry.update({
        where: { username },
        data: {
          walletAddress: chainData.wallet,
          onChainAddress: chainData.pda,
        },
      });
    }

    return chainData;
  }
}
