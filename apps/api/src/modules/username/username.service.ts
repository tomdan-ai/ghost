import { prisma } from '../../config/database';
import { cacheService } from '../../config/redis';

export class UsernameService {
  private readonly usernameRegex = /^[a-z0-9]{3,20}$/; // alphanumeric, lowercase, 3-20 chars
  private readonly reservedUsernames = [
    'admin', 'administrator', 'root', 'system', 'support', 'help',
    'ghost', 'ghostwallet', 'ghostapp', 'api', 'web', 'mobile',
    'test', 'demo', 'example', 'user', 'username', 'account',
  ];

  // Validate username format
  validateUsername(username: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check length
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 20) {
      errors.push('Username must be at most 20 characters long');
    }

    // Check format (alphanumeric, lowercase)
    if (!this.usernameRegex.test(username)) {
      errors.push('Username can only contain lowercase letters and numbers (a-z, 0-9)');
    }

    // Check for reserved usernames
    if (this.reservedUsernames.includes(username.toLowerCase())) {
      errors.push('This username is reserved');
    }

    // Check for offensive/inappropriate content (basic check)
    if (this.containsInappropriateContent(username)) {
      errors.push('Username contains inappropriate content');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Check username availability with caching
  async checkAvailability(username: string): Promise<{
    available: boolean;
    cached: boolean;
    validation?: { valid: boolean; errors: string[] };
  }> {
    // First validate the username format
    const validation = this.validateUsername(username);
    if (!validation.valid) {
      return {
        available: false,
        cached: false,
        validation,
      };
    }

    // Check cache first
    const cacheKey = `username:availability:${username.toLowerCase()}`;
    const cached = await cacheService.getCachedUsernameAvailability(username);
    
    if (cached) {
      return {
        available: cached.available,
        cached: true,
      };
    }

    // Check database
    const existing = await prisma.usernameRegistry.findUnique({
      where: { username: username.toLowerCase() },
    });

    const isAvailable = !existing;

    // Cache the result
    await cacheService.cacheUsernameAvailability(username, isAvailable);

    return {
      available: isAvailable,
      cached: false,
    };
  }

  // Register username with validation
  async register(
    username: string,
    walletAddress: string,
    userId: string
  ): Promise<{
    success: boolean;
    registry?: any;
    errors?: string[];
  }> {
    try {
      // Validate username format
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check availability
      const availability = await this.checkAvailability(username);
      if (!availability.available) {
        return {
          success: false,
          errors: ['Username already taken'],
        };
      }

      // Verify user exists and owns the wallet
      const user = await prisma.user.findUnique({
        where: { id: userId, walletAddress },
      });

      if (!user) {
        return {
          success: false,
          errors: ['User not found or wallet address mismatch'],
        };
      }

      // Check if user already has a username
      const existingRegistry = await prisma.usernameRegistry.findUnique({
        where: { walletAddress },
      });

      if (existingRegistry) {
        return {
          success: false,
          errors: ['User already has a registered username'],
        };
      }

      // Create username registry entry
      const registry = await prisma.usernameRegistry.create({
        data: {
          username: username.toLowerCase(),
          walletAddress,
          userId,
        },
      });

      // Update user's username
      await prisma.user.update({
        where: { id: userId },
        data: { username: username.toLowerCase() },
      });

      // Invalidate cache
      await cacheService.invalidateUserProfile(walletAddress);
      await cacheService.delete(`username:availability:${username.toLowerCase()}`);

      return {
        success: true,
        registry,
      };
    } catch (error) {
      console.error('Username registration error:', error);
      
      if (error instanceof Error) {
        // Handle unique constraint violations
        if (error.message.includes('Unique constraint')) {
          return {
            success: false,
            errors: ['Username already taken'],
          };
        }
      }

      return {
        success: false,
        errors: ['Registration failed'],
      };
    }
  }

  // Resolve username to wallet address with caching
  async resolve(username: string): Promise<{
    found: boolean;
    data?: any;
    cached?: boolean;
  }> {
    // Check cache first
    const cacheKey = `username:resolve:${username.toLowerCase()}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return {
        found: true,
        data: cached,
        cached: true,
      };
    }

    // Query database
    const registry = await prisma.usernameRegistry.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            createdAt: true,
          },
        },
      },
    });

    if (!registry) {
      return {
        found: false,
      };
    }

    // Cache the result
    await cacheService.set(cacheKey, registry, 10 * 60 * 1000); // 10 minutes

    return {
      found: true,
      data: registry,
      cached: false,
    };
  }

  // Get username by wallet address
  async getByWallet(walletAddress: string): Promise<any> {
    return prisma.usernameRegistry.findUnique({
      where: { walletAddress },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // Update username (for existing users)
  async updateUsername(
    userId: string,
    newUsername: string
  ): Promise<{
    success: boolean;
    errors?: string[];
  }> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { usernameRegistry: true },
      });

      if (!user) {
        return {
          success: false,
          errors: ['User not found'],
        };
      }

      // Validate new username
      const validation = this.validateUsername(newUsername);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check availability
      const availability = await this.checkAvailability(newUsername);
      if (!availability.available) {
        return {
          success: false,
          errors: ['Username already taken'],
        };
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Delete old registry entry if exists
        if (user.usernameRegistry) {
          await tx.usernameRegistry.delete({
            where: { id: user.usernameRegistry.id },
          });
        }

        // Create new registry entry
        const newRegistry = await tx.usernameRegistry.create({
          data: {
            username: newUsername.toLowerCase(),
            walletAddress: user.walletAddress,
            userId: user.id,
          },
        });

        // Update user
        await tx.user.update({
          where: { id: userId },
          data: { username: newUsername.toLowerCase() },
        });

        return newRegistry;
      });

      // Invalidate caches
      await cacheService.invalidateUserCaches(user.walletAddress);
      await cacheService.delete(`username:availability:${newUsername.toLowerCase()}`);
      if (user.username) {
        await cacheService.delete(`username:availability:${user.username.toLowerCase()}`);
        await cacheService.delete(`username:resolve:${user.username.toLowerCase()}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Username update error:', error);
      return {
        success: false,
        errors: ['Update failed'],
      };
    }
  }

  // Search usernames (for autocomplete)
  async searchUsernames(query: string, limit: number = 10): Promise<any[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return prisma.usernameRegistry.findMany({
      where: {
        username: {
          contains: query.toLowerCase(),
          mode: 'insensitive',
        },
      },
      take: limit,
      select: {
        username: true,
        walletAddress: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
    });
  }

  // Get username statistics
  async getStats(): Promise<{
    total: number;
    recent: number;
    popularUsernames: Array<{ username: string; count: number }>;
  }> {
    const total = await prisma.usernameRegistry.count();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recent = await prisma.usernameRegistry.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // Note: In production, you'd have a separate table for username popularity
    // For now, return placeholder
    const popularUsernames = [];

    return {
      total,
      recent,
      popularUsernames,
    };
  }

  // Check for inappropriate content (basic implementation)
  private containsInappropriateContent(username: string): boolean {
    const inappropriatePatterns = [
      /fuck/i,
      /shit/i,
      /asshole/i,
      /bitch/i,
      /nigger/i,
      /cunt/i,
      /dick/i,
      /pussy/i,
      /whore/i,
      /slut/i,
    ];

    return inappropriatePatterns.some(pattern => pattern.test(username));
  }

  // Generate suggested usernames
  generateSuggestions(baseUsername: string, count: number = 5): string[] {
    const suggestions: string[] = [];
    const cleanBase = baseUsername.replace(/[^a-z0-9]/g, '').toLowerCase();

    if (cleanBase.length >= 3) {
      suggestions.push(cleanBase);
    }

    // Add numbers
    for (let i = 1; i <= count; i++) {
      const suggestion = `${cleanBase}${i}`;
      if (suggestion.length <= 20) {
        suggestions.push(suggestion);
      }
    }

    // Add common suffixes
    const suffixes = ['official', 'real', 'true', 'the', 'one', 'only'];
    for (const suffix of suffixes) {
      const suggestion = `${cleanBase}${suffix}`;
      if (suggestion.length <= 20) {
        suggestions.push(suggestion);
      }
    }

    // Ensure uniqueness and limit
    return [...new Set(suggestions)]
      .filter(username => this.usernameRegex.test(username))
      .slice(0, count);
  }
}
