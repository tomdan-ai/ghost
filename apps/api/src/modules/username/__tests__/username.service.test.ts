/**
 * Unit tests for UsernameService - username validation and format checking
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */

// Mock dependencies before importing the service
jest.mock('../../../config/database', () => ({
  prisma: {
    usernameRegistry: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../config/redis', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    getCachedUsernameAvailability: jest.fn().mockResolvedValue(null),
    cacheUsernameAvailability: jest.fn().mockResolvedValue(undefined),
    invalidateUserProfile: jest.fn().mockResolvedValue(undefined),
    invalidateUserCaches: jest.fn().mockResolvedValue(undefined),
  },
}));

import { UsernameService } from '../username.service';
import { prisma } from '../../../config/database';
import { cacheService } from '../../../config/redis';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCache = cacheService as jest.Mocked<typeof cacheService>;

describe('UsernameService', () => {
  let service: UsernameService;

  beforeEach(() => {
    service = new UsernameService();
    jest.clearAllMocks();
  });

  // ─── validateUsername ────────────────────────────────────────────────────────

  describe('validateUsername', () => {
    describe('valid usernames (Requirement 2.1)', () => {
      it('accepts a lowercase alphanumeric username of minimum length (3 chars)', () => {
        const result = service.validateUsername('abc');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('accepts a lowercase alphanumeric username of maximum length (20 chars)', () => {
        const result = service.validateUsername('abcdefghij1234567890');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('accepts a username with only lowercase letters', () => {
        const result = service.validateUsername('alice');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('accepts a username with only digits', () => {
        const result = service.validateUsername('123');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('accepts a username mixing letters and numbers', () => {
        const result = service.validateUsername('user42');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('length validation (Requirement 2.1)', () => {
      it('rejects a username shorter than 3 characters', () => {
        const result = service.validateUsername('ab');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Username must be at least 3 characters long');
      });

      it('rejects a single-character username', () => {
        const result = service.validateUsername('a');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('3 characters'))).toBe(true);
      });

      it('rejects an empty username', () => {
        const result = service.validateUsername('');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('rejects a username longer than 20 characters', () => {
        const result = service.validateUsername('abcdefghij12345678901'); // 21 chars
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Username must be at most 20 characters long');
      });
    });

    describe('format validation - special characters and spaces (Requirement 2.9)', () => {
      it('rejects a username with spaces', () => {
        const result = service.validateUsername('user name');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('lowercase letters and numbers'))).toBe(true);
      });

      it('rejects a username with underscores', () => {
        const result = service.validateUsername('user_name');
        expect(result.valid).toBe(false);
      });

      it('rejects a username with hyphens', () => {
        const result = service.validateUsername('user-name');
        expect(result.valid).toBe(false);
      });

      it('rejects a username with dots', () => {
        const result = service.validateUsername('user.name');
        expect(result.valid).toBe(false);
      });

      it('rejects a username with @ symbol', () => {
        const result = service.validateUsername('user@name');
        expect(result.valid).toBe(false);
      });

      it('rejects a username with uppercase letters (Requirement 2.8)', () => {
        const result = service.validateUsername('UserName');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('lowercase letters and numbers'))).toBe(true);
      });

      it('rejects a username with mixed case', () => {
        const result = service.validateUsername('Alice');
        expect(result.valid).toBe(false);
      });

      it('rejects a username with special characters', () => {
        const result = service.validateUsername('user!');
        expect(result.valid).toBe(false);
      });
    });

    describe('reserved usernames', () => {
      it('rejects "admin" as a reserved username', () => {
        const result = service.validateUsername('admin');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('This username is reserved');
      });

      it('rejects "root" as a reserved username', () => {
        const result = service.validateUsername('root');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('This username is reserved');
      });

      it('rejects "ghost" as a reserved username', () => {
        const result = service.validateUsername('ghost');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('This username is reserved');
      });

      it('rejects "system" as a reserved username', () => {
        const result = service.validateUsername('system');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('This username is reserved');
      });
    });

    describe('multiple errors', () => {
      it('returns multiple errors when username has both length and format issues', () => {
        // "AB" is too short AND has uppercase
        const result = service.validateUsername('AB');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
      });
    });
  });

  // ─── checkAvailability ───────────────────────────────────────────────────────

  describe('checkAvailability', () => {
    it('returns invalid validation result for invalid username format (Requirement 2.5)', async () => {
      const result = await service.checkAvailability('AB');
      expect(result.available).toBe(false);
      expect(result.validation).toBeDefined();
      expect(result.validation!.valid).toBe(false);
    });

    it('returns available=true when username is not in database (Requirement 2.5)', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.checkAvailability('alice');
      expect(result.available).toBe(true);
      expect(result.cached).toBe(false);
    });

    it('returns available=false when username exists in database (Requirement 2.3)', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'some-id',
        username: 'alice',
        walletAddress: '0x1234',
        userId: 'user-id',
        createdAt: new Date(),
      });

      const result = await service.checkAvailability('alice');
      expect(result.available).toBe(false);
    });

    it('checks availability using lowercase version of username (Requirement 2.8)', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      // Even though "Alice" would fail format validation (uppercase), 
      // a valid lowercase username should be checked in lowercase
      await service.checkAvailability('alice');

      expect(mockPrisma.usernameRegistry.findUnique).toHaveBeenCalledWith({
        where: { username: 'alice' },
      });
    });

    it('returns cached result when cache hit occurs', async () => {
      (mockCache.getCachedUsernameAvailability as jest.Mock).mockResolvedValue({
        available: true,
        timestamp: Date.now(),
      });

      const result = await service.checkAvailability('alice');
      expect(result.available).toBe(true);
      expect(result.cached).toBe(true);
      // Should not hit the database
      expect(mockPrisma.usernameRegistry.findUnique).not.toHaveBeenCalled();
    });

    it('caches the result after a database lookup', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await service.checkAvailability('alice');

      expect(mockCache.cacheUsernameAvailability).toHaveBeenCalledWith('alice', true);
    });
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    const validUsername = 'alice';
    const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const userId = 'user-uuid-1234';

    it('returns errors for invalid username format (Requirement 2.1)', async () => {
      const result = await service.register('AB!', walletAddress, userId);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('returns error when username is already taken (Requirement 2.3)', async () => {
      // Username passes format validation
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        username: validUsername,
        walletAddress: '0xother',
        userId: 'other-user',
        createdAt: new Date(),
      });

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Username already taken');
    });

    it('stores username in lowercase (Requirement 2.8)', async () => {
      // "alice" is already lowercase and valid
      (mockPrisma.usernameRegistry.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // availability check
        .mockResolvedValueOnce(null); // existing registry check

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        walletAddress,
        username: null,
        usernameRegistry: null,
      });

      (mockPrisma.usernameRegistry.create as jest.Mock).mockResolvedValue({
        id: 'new-id',
        username: validUsername,
        walletAddress,
        userId,
        createdAt: new Date(),
      });

      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await service.register(validUsername, walletAddress, userId);

      expect(mockPrisma.usernameRegistry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: validUsername.toLowerCase(),
          }),
        })
      );
    });

    it('returns error when user not found or wallet mismatch', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('User not found or wallet address mismatch');
    });

    it('returns error when user already has a registered username', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // availability check (username not taken)
        .mockResolvedValueOnce({     // existing registry for wallet
          id: 'existing-id',
          username: 'oldname',
          walletAddress,
          userId,
          createdAt: new Date(),
        });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        walletAddress,
        username: 'oldname',
      });

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('User already has a registered username');
    });

    it('successfully registers a valid username (Requirement 2.2)', async () => {
      (mockPrisma.usernameRegistry.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // availability check
        .mockResolvedValueOnce(null); // existing registry check

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        walletAddress,
        username: null,
      });

      const registryEntry = {
        id: 'new-id',
        username: validUsername,
        walletAddress,
        userId,
        createdAt: new Date(),
      };

      (mockPrisma.usernameRegistry.create as jest.Mock).mockResolvedValue(registryEntry);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(true);
      expect(result.registry).toEqual(registryEntry);
    });
  });

  // ─── resolve ─────────────────────────────────────────────────────────────────

  describe('resolve', () => {
    it('returns found=false when username does not exist (Requirement 2.7)', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.resolve('nonexistent');
      expect(result.found).toBe(false);
    });

    it('returns found=true with data when username exists (Requirement 2.6)', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue(null);

      const registryData = {
        id: 'reg-id',
        username: 'alice',
        walletAddress: '0xabc',
        userId: 'user-id',
        createdAt: new Date(),
        user: {
          id: 'user-id',
          walletAddress: '0xabc',
          username: 'alice',
          createdAt: new Date(),
        },
      };

      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(registryData);

      const result = await service.resolve('alice');
      expect(result.found).toBe(true);
      expect(result.data).toEqual(registryData);
    });

    it('resolves using lowercase username (Requirement 2.8)', async () => {
      (mockCache.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.usernameRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await service.resolve('Alice');

      expect(mockPrisma.usernameRegistry.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: 'alice' },
        })
      );
    });

    it('returns cached result when available', async () => {
      const cachedData = { id: 'reg-id', username: 'alice', walletAddress: '0xabc' };
      (mockCache.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await service.resolve('alice');
      expect(result.found).toBe(true);
      expect(result.cached).toBe(true);
      expect(mockPrisma.usernameRegistry.findUnique).not.toHaveBeenCalled();
    });
  });

  // ─── generateSuggestions ─────────────────────────────────────────────────────

  describe('generateSuggestions', () => {
    it('generates suggestions based on a valid base username', () => {
      const suggestions = service.generateSuggestions('alice');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(s => /^[a-z0-9]{3,20}$/.test(s))).toBe(true);
    });

    it('strips special characters from base username before generating suggestions', () => {
      const suggestions = service.generateSuggestions('alice!@#');
      expect(suggestions.every(s => /^[a-z0-9]{3,20}$/.test(s))).toBe(true);
    });

    it('returns at most the requested count of suggestions', () => {
      const suggestions = service.generateSuggestions('alice', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('returns unique suggestions', () => {
      const suggestions = service.generateSuggestions('alice', 10);
      const unique = new Set(suggestions);
      expect(unique.size).toBe(suggestions.length);
    });
  });
});
