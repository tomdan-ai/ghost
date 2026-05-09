/**
 * Unit tests for UsernameService - username validation and format checking
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */

// Mock dependencies before importing the service
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../../../config/database', () => ({
  prisma: {
    usernameRegistry: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const mockGetCachedAvailability = jest.fn();
const mockCacheAvailability = jest.fn();
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDelete = jest.fn();
const mockInvalidateUserProfile = jest.fn();
const mockInvalidateUserCaches = jest.fn();

jest.mock('../../../config/redis', () => ({
  cacheService: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
    delete: (...args: unknown[]) => mockCacheDelete(...args),
    getCachedUsernameAvailability: (...args: unknown[]) => mockGetCachedAvailability(...args),
    cacheUsernameAvailability: (...args: unknown[]) => mockCacheAvailability(...args),
    invalidateUserProfile: (...args: unknown[]) => mockInvalidateUserProfile(...args),
    invalidateUserCaches: (...args: unknown[]) => mockInvalidateUserCaches(...args),
  },
}));

import { UsernameService } from '../username.service';

describe('UsernameService', () => {
  let service: UsernameService;

  beforeEach(() => {
    service = new UsernameService();
    jest.clearAllMocks();
    // Default: no cache hits
    mockGetCachedAvailability.mockResolvedValue(null);
    mockCacheAvailability.mockResolvedValue(undefined);
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockCacheDelete.mockResolvedValue(undefined);
    mockInvalidateUserProfile.mockResolvedValue(undefined);
    mockInvalidateUserCaches.mockResolvedValue(undefined);
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
      mockFindUnique.mockResolvedValue(null);

      const result = await service.checkAvailability('alice');
      expect(result.available).toBe(true);
      expect(result.cached).toBe(false);
    });

    it('returns available=false when username exists in database (Requirement 2.3)', async () => {
      mockFindUnique.mockResolvedValue({
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
      mockFindUnique.mockResolvedValue(null);

      await service.checkAvailability('alice');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { username: 'alice' },
      });
    });

    it('returns cached result when cache hit occurs', async () => {
      mockGetCachedAvailability.mockResolvedValue({
        available: true,
        timestamp: Date.now(),
      });

      const result = await service.checkAvailability('alice');
      expect(result.available).toBe(true);
      expect(result.cached).toBe(true);
      // Should not hit the database
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('caches the result after a database lookup', async () => {
      mockFindUnique.mockResolvedValue(null);

      await service.checkAvailability('alice');

      expect(mockCacheAvailability).toHaveBeenCalledWith('alice', true);
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
      // availability check: username is taken
      mockFindUnique.mockResolvedValueOnce({
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
      // availability check: not taken
      mockFindUnique
        .mockResolvedValueOnce(null)  // checkAvailability → usernameRegistry.findUnique
        .mockResolvedValueOnce(null); // existing registry check → usernameRegistry.findUnique (by walletAddress)

      mockUserFindUnique.mockResolvedValue({
        id: userId,
        walletAddress,
        username: null,
      });

      mockCreate.mockResolvedValue({
        id: 'new-id',
        username: validUsername,
        walletAddress,
        userId,
        createdAt: new Date(),
      });

      mockUserUpdate.mockResolvedValue({});

      await service.register(validUsername, walletAddress, userId);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: validUsername.toLowerCase(),
          }),
        })
      );
    });

    it('returns error when user not found or wallet mismatch', async () => {
      mockFindUnique.mockResolvedValue(null); // username available
      mockUserFindUnique.mockResolvedValue(null); // user not found

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('User not found or wallet address mismatch');
    });

    it('returns error when user already has a registered username', async () => {
      // availability check: username not taken
      mockFindUnique
        .mockResolvedValueOnce(null) // checkAvailability: username not taken
        .mockResolvedValueOnce({     // existing registry for this wallet
          id: 'existing-id',
          username: 'oldname',
          walletAddress,
          userId,
          createdAt: new Date(),
        });

      mockUserFindUnique.mockResolvedValue({
        id: userId,
        walletAddress,
        username: 'oldname',
      });

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('User already has a registered username');
    });

    it('successfully registers a valid username (Requirement 2.2)', async () => {
      mockFindUnique
        .mockResolvedValueOnce(null) // availability check
        .mockResolvedValueOnce(null); // existing registry check

      mockUserFindUnique.mockResolvedValue({
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

      mockCreate.mockResolvedValue(registryEntry);
      mockUserUpdate.mockResolvedValue({});

      const result = await service.register(validUsername, walletAddress, userId);
      expect(result.success).toBe(true);
      expect(result.registry).toEqual(registryEntry);
    });
  });

  // ─── resolve ─────────────────────────────────────────────────────────────────

  describe('resolve', () => {
    it('returns found=false when username does not exist (Requirement 2.7)', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue(null);

      const result = await service.resolve('nonexistent');
      expect(result.found).toBe(false);
    });

    it('returns found=true with data when username exists (Requirement 2.6)', async () => {
      mockCacheGet.mockResolvedValue(null);

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

      mockFindUnique.mockResolvedValue(registryData);

      const result = await service.resolve('alice');
      expect(result.found).toBe(true);
      expect(result.data).toEqual(registryData);
    });

    it('resolves using lowercase username (Requirement 2.8)', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue(null);

      await service.resolve('Alice');

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { username: 'alice' },
        })
      );
    });

    it('returns cached result when available', async () => {
      const cachedData = { id: 'reg-id', username: 'alice', walletAddress: '0xabc' };
      mockCacheGet.mockResolvedValue(cachedData);

      const result = await service.resolve('alice');
      expect(result.found).toBe(true);
      expect(result.cached).toBe(true);
      expect(mockFindUnique).not.toHaveBeenCalled();
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
