import { PublicKey } from '@solana/web3.js';
import { prisma } from '../../config/database';
import { cacheService } from '../../config/redis';
import { SolanaUsernameService } from './solana.service';

// Extract the transaction client type from Prisma's $transaction method
type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const solanaService = new SolanaUsernameService();

export class UsernameService {
  private readonly usernameRegex = /^[a-z0-9]{3,20}$/; // alphanumeric, lowercase, 3-20 chars
  private readonly reservedUsernames = [
    'admin', 'administrator', 'root', 'system', 'support', 'help',
    'ghost', 'ghostwallet', 'ghostapp', 'api', 'web', 'mobile',
    'test', 'demo', 'example', 'user', 'username', 'account',
  ];

  // ─── Validation ────────────────────────────────────────────────────────────

  validateUsername(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 20) {
      errors.push('Username must be at most 20 characters long');
    }

    if (!this.usernameRegex.test(username)) {
      errors.push('Username can only contain lowercase letters and numbers (a-z, 0-9)');
    }

    if (this.reservedUsernames.includes(username.toLowerCase())) {
      errors.push('This username is reserved');
    }

    if (this.containsInappropriateContent(username)) {
      errors.push('Username contains inappropriate content');
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Availability ──────────────────────────────────────────────────────────

  /**
   * Check username availability against both the database and the blockchain.
   */
  async checkAvailability(username: string): Promise<{
    available: boolean;
    cached: boolean;
    validation?: { valid: boolean; errors: string[] };
  }> {
    try {
      // Validate format first
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return { available: false, cached: false, validation };
      }

      // Check Redis cache
      const cached = await cacheService.getCachedUsernameAvailability(username);
      if (cached) {
        return { available: cached.available, cached: true };
      }

      // Check database
      try {
        const existingInDb = await prisma.usernameRegistry.findUnique({
          where: { username: username.toLowerCase() },
        });

        if (existingInDb) {
          await cacheService.cacheUsernameAvailability(username, false);
          return { available: false, cached: false };
        }
      } catch (error) {
        console.error('Username availability DB check failed, falling back to chain:', error);
      }

      try {
        // Check blockchain (authoritative source)
        const existsOnChain = await solanaService.checkUsernameOnChain(username);
        const isAvailable = !existsOnChain;

        await cacheService.cacheUsernameAvailability(username, isAvailable);
        return { available: isAvailable, cached: false };
      } catch (error) {
        console.error('Username availability chain check failed:', error);
        return { available: false, cached: false };
      }
    } catch (error) {
      console.error('Username availability check failed:', error);
      return { available: false, cached: false };
    }
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a username on-chain first, then persist to the database.
   */
  async register(
    username: string,
    walletAddress: string,
    userId: string,
    options?: { skipDb?: boolean }
  ): Promise<{ success: boolean; registry?: any; errors?: string[] }> {
    try {
      const skipDb = options?.skipDb === true;

      // Validate format
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Check availability (DB + chain)
      const availability = await this.checkAvailability(username);
      if (!availability.available) {
        return { success: false, errors: ['Username already taken'] };
      }

      if (!skipDb) {
        // Verify user exists and owns the wallet
        const user = await prisma.user.findUnique({
          where: { id: userId, walletAddress },
        });
        if (!user) {
          return { success: false, errors: ['User not found or wallet address mismatch'] };
        }

        // Check if user already has a username
        const existingRegistry = await prisma.usernameRegistry.findUnique({
          where: { walletAddress },
        });
        if (existingRegistry) {
          return { success: false, errors: ['User already has a registered username'] };
        }
      }

      // Register on blockchain first
      const userWallet = new PublicKey(walletAddress);
      const { signature, registryPDA } = await solanaService.registerUsername(
        username.toLowerCase(),
        userWallet
      );

      if (skipDb) {
        await cacheService.delete(`username:availability:${username.toLowerCase()}`);
        return {
          success: true,
          registry: {
            username: username.toLowerCase(),
            walletAddress,
            onChainAddress: registryPDA,
            registrationTx: signature,
          },
        };
      }

      // Persist to database
      const registry = await prisma.usernameRegistry.create({
        data: {
          username: username.toLowerCase(),
          walletAddress,
          userId,
          onChainAddress: registryPDA,
          registrationTx: signature,
        },
      });

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: { username: username.toLowerCase() },
      });

      // Invalidate caches
      await cacheService.invalidateUserProfile(walletAddress);
      await cacheService.delete(`username:availability:${username.toLowerCase()}`);

      return { success: true, registry };
    } catch (error) {
      console.error('Username registration error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          return { success: false, errors: ['Username already taken'] };
        }
      }

      return { success: false, errors: ['Registration failed'] };
    }
  }

  // ─── Resolution ────────────────────────────────────────────────────────────

  /**
   * Resolve a username to its wallet address and user data.
   * Checks database first (fast), falls back to blockchain.
   */
  async resolve(username: string): Promise<{
    found: boolean;
    data?: any;
    cached?: boolean;
  }> {
    const cacheKey = `username:resolve:${username.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return { found: true, data: cached, cached: true };
    }

    // Try database first
    try {
      const registry = await prisma.usernameRegistry.findUnique({
        where: { username: username.toLowerCase() },
        include: {
          user: {
            select: { id: true, walletAddress: true, username: true, createdAt: true },
          },
        },
      });

      if (registry) {
        await cacheService.set(cacheKey, registry, 10 * 60 * 1000);
        return { found: true, data: registry, cached: false };
      }
    } catch (error) {
      console.error('Username resolve DB lookup failed, falling back to chain:', error);
    }

    // Fallback to blockchain
    const chainData = await solanaService.getUsernameRegistry(username);
    if (chainData) {
      const data = {
        username: chainData.username,
        walletAddress: chainData.wallet,
        onChainAddress: chainData.pda,
        createdAt: new Date(chainData.createdAt * 1000),
      };
      await cacheService.set(cacheKey, data, 10 * 60 * 1000);
      return { found: true, data, cached: false };
    }

    return { found: false };
  }

  // ─── Lookup by wallet ──────────────────────────────────────────────────────

  async getByWallet(walletAddress: string): Promise<any> {
    // Check database first
    const dbResult = await prisma.usernameRegistry.findUnique({
      where: { walletAddress },
      include: {
        user: {
          select: { id: true, walletAddress: true, username: true, createdAt: true },
        },
      },
    });

    if (dbResult) {
      return dbResult;
    }

    // Fallback to blockchain
    try {
      const userWallet = new PublicKey(walletAddress);
      const chainUsernames = await solanaService.getUsernamesByWallet(userWallet);
      return chainUsernames[0] || null;
    } catch {
      return null;
    }
  }

  // ─── Update username ───────────────────────────────────────────────────────

  async updateUsername(
    userId: string,
    newUsername: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { usernameRegistry: true },
      });

      if (!user) {
        return { success: false, errors: ['User not found'] };
      }

      const validation = this.validateUsername(newUsername);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      const availability = await this.checkAvailability(newUsername);
      if (!availability.available) {
        return { success: false, errors: ['Username already taken'] };
      }

      await prisma.$transaction(async (tx: PrismaTransactionClient) => {
        if (user.usernameRegistry) {
          await tx.usernameRegistry.delete({
            where: { id: user.usernameRegistry.id },
          });
        }

        await tx.usernameRegistry.create({
          data: {
            username: newUsername.toLowerCase(),
            walletAddress: user.walletAddress,
            userId: user.id,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { username: newUsername.toLowerCase() },
        });
      });

      // Invalidate caches
      await cacheService.invalidateUserCaches(user.walletAddress);
      await cacheService.delete(`username:availability:${newUsername.toLowerCase()}`);
      if (user.username) {
        await cacheService.delete(`username:availability:${user.username.toLowerCase()}`);
        await cacheService.delete(`username:resolve:${user.username.toLowerCase()}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Username update error:', error);
      return { success: false, errors: ['Update failed'] };
    }
  }

  // ─── Blockchain sync ───────────────────────────────────────────────────────

  /**
   * Sync a username from the blockchain into the database.
   */
  async syncFromBlockchain(username: string): Promise<any> {
    const chainData = await solanaService.getUsernameRegistry(username);
    if (!chainData) {
      throw new Error('Username not found on blockchain');
    }

    const existing = await prisma.usernameRegistry.findUnique({ where: { username } });
    if (existing) {
      return prisma.usernameRegistry.update({
        where: { username },
        data: {
          walletAddress: chainData.wallet,
          onChainAddress: chainData.pda,
        },
      });
    }

    return chainData;
  }

  // ─── Search / stats ────────────────────────────────────────────────────────

  async searchUsernames(query: string, limit = 10): Promise<any[]> {
    if (!query || query.length < 2) return [];

    return prisma.usernameRegistry.findMany({
      where: {
        username: { contains: query.toLowerCase(), mode: 'insensitive' },
      },
      take: limit,
      select: {
        username: true,
        walletAddress: true,
        createdAt: true,
        user: {
          select: { id: true, walletAddress: true, username: true, createdAt: true },
        },
      },
      orderBy: { username: 'asc' },
    });
  }

  async getStats(): Promise<{
    total: number;
    recent: number;
    popularUsernames: Array<{ username: string; count: number }>;
  }> {
    const total = await prisma.usernameRegistry.count();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recent = await prisma.usernameRegistry.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });

    return { total, recent, popularUsernames: [] };
  }

  generateSuggestions(baseUsername: string, count = 5): string[] {
    const cleanBase = baseUsername.replace(/[^a-z0-9]/g, '').toLowerCase();
    const suggestions: string[] = [];

    if (cleanBase.length >= 3) suggestions.push(cleanBase);

    for (let i = 1; i <= count; i++) {
      const s = `${cleanBase}${i}`;
      if (s.length <= 20) suggestions.push(s);
    }

    for (const suffix of ['official', 'real', 'true', 'the', 'one', 'only']) {
      const s = `${cleanBase}${suffix}`;
      if (s.length <= 20) suggestions.push(s);
    }

    return [...new Set(suggestions)]
      .filter((u) => this.usernameRegex.test(u))
      .slice(0, count);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private containsInappropriateContent(username: string): boolean {
    const patterns = [/fuck/i, /shit/i, /asshole/i, /bitch/i, /nigger/i, /cunt/i, /dick/i, /pussy/i, /whore/i, /slut/i];
    return patterns.some((p) => p.test(username));
  }
}
