import { envSchema, getConfig } from '../env';

describe('Environment Validation', () => {
  beforeEach(() => {
    // Clear any cached config
    jest.resetModules();
  });

  describe('envSchema', () => {
    it('should validate correct environment variables', () => {
      const validEnv = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        REDIS_URL: 'redis://localhost:6379',
        LIFI_API_KEY: 'test-lifi-api-key',
        SOLANA_RPC_URL: 'https://api.testnet.solana.com',
        JWT_SECRET: 'test-jwt-secret-must-be-at-least-32-characters-long',
        PORT: '3001',
        NODE_ENV: 'development',
        CORS_ORIGIN: 'http://localhost:3000',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_MAX_AUTH_ATTEMPTS: '10',
        CACHE_TTL_ROUTES_MS: '300000',
        CACHE_TTL_USERNAME_MS: '60000',
        CACHE_TTL_PROFILE_MS: '600000',
      };

      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidEnv = {
        // Missing SUPABASE_URL
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        // Missing other required fields...
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject invalid URLs', () => {
      const invalidEnv = {
        SUPABASE_URL: 'not-a-url',
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        REDIS_URL: 'redis://localhost:6379',
        LIFI_API_KEY: 'test-lifi-api-key',
        SOLANA_RPC_URL: 'https://api.testnet.solana.com',
        JWT_SECRET: 'test-jwt-secret-must-be-at-least-32-characters-long',
        PORT: '3001',
        NODE_ENV: 'development',
        CORS_ORIGIN: 'http://localhost:3000',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_MAX_AUTH_ATTEMPTS: '10',
        CACHE_TTL_ROUTES_MS: '300000',
        CACHE_TTL_USERNAME_MS: '60000',
        CACHE_TTL_PROFILE_MS: '600000',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('must be a valid URL');
      }
    });

    it('should reject invalid NODE_ENV values', () => {
      const invalidEnv = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        REDIS_URL: 'redis://localhost:6379',
        LIFI_API_KEY: 'test-lifi-api-key',
        SOLANA_RPC_URL: 'https://api.testnet.solana.com',
        JWT_SECRET: 'test-jwt-secret-must-be-at-least-32-characters-long',
        PORT: '3001',
        NODE_ENV: 'invalid-env',
        CORS_ORIGIN: 'http://localhost:3000',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_MAX_AUTH_ATTEMPTS: '10',
        CACHE_TTL_ROUTES_MS: '300000',
        CACHE_TTL_USERNAME_MS: '60000',
        CACHE_TTL_PROFILE_MS: '600000',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const envWithDefaults = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        LIFI_API_KEY: 'test-lifi-api-key',
        JWT_SECRET: 'test-jwt-secret-must-be-at-least-32-characters-long',
        // Missing optional fields should get defaults
      };

      const result = envSchema.safeParse(envWithDefaults);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.REDIS_URL).toBe('redis://localhost:6379');
        expect(result.data.SOLANA_RPC_URL).toBe('https://api.mainnet-beta.solana.com');
        expect(result.data.PORT).toBe('3001');
        expect(result.data.NODE_ENV).toBe('development');
      }
    });
  });

  describe('getConfig', () => {
    it('should return parsed configuration', () => {
      const config = getConfig();
      
      expect(config).toHaveProperty('isProduction');
      expect(config).toHaveProperty('isDevelopment');
      expect(config).toHaveProperty('isTest');
      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('supabase');
      expect(config).toHaveProperty('redis');
      expect(config).toHaveProperty('rateLimit');
      expect(config).toHaveProperty('cache');
      expect(config).toHaveProperty('external');
      expect(config).toHaveProperty('security');
    });

    it('should parse numeric values correctly', () => {
      const config = getConfig();
      
      expect(typeof config.server.port).toBe('number');
      expect(typeof config.rateLimit.windowMs).toBe('number');
      expect(typeof config.rateLimit.maxRequests).toBe('number');
      expect(typeof config.cache.routesTtlMs).toBe('number');
    });

    it('should correctly identify environment', () => {
      const config = getConfig();
      
      if (process.env.NODE_ENV === 'test') {
        expect(config.isTest).toBe(true);
        expect(config.isDevelopment).toBe(false);
        expect(config.isProduction).toBe(false);
      }
    });
  });
});