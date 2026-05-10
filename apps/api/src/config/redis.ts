import { createClient, RedisClientType } from 'redis';
import { config } from './env';

export type RedisClient = RedisClientType;

let redisClient: RedisClient | null = null;
let isConnected = false;

// Create Redis client with configuration
export function createRedisClient(): RedisClient {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.redis.url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('❌ Redis connection failed after 10 retries');
          return new Error('Max retries reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  // Error handling
  redisClient.on('error', (err) => {
    console.error('❌ Redis client error:', err);
    isConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('🔗 Redis client connecting...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
    isConnected = true;
  });

  redisClient.on('end', () => {
    console.log('🔌 Redis client disconnected');
    isConnected = false;
  });

  return redisClient;
}

// Get or create Redis client
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

// Connect to Redis
export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // Don't exit process - allow fallback to direct API calls
  }
}

// Disconnect from Redis
export async function disconnectRedis(): Promise<void> {
  if (redisClient && isConnected) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('🔌 Redis disconnected');
  }
}

// Check if Redis is connected
export function isRedisConnected(): boolean {
  return isConnected;
}

// Cache service for LI.FI routes, username checks, and user profiles
export class CacheService {
  private client: RedisClient;
  private readonly defaultTtl = {
    routes: config.cache.routesTtlMs, // 5 minutes
    username: config.cache.usernameTtlMs, // 1 minute
    profile: config.cache.profileTtlMs, // 10 minutes
  };

  constructor() {
    this.client = getRedisClient();
  }

  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    if (!isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('⚠️ Cache get failed, falling back to direct call:', error);
      return null;
    }
  }

  // Set cached value with TTL
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (!isConnected) return;

    try {
      const ttl = ttlMs ? Math.ceil(ttlMs / 1000) : undefined;
      if (ttl !== undefined) {
        await this.client.set(key, JSON.stringify(value), { EX: ttl });
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('⚠️ Cache set failed:', error);
    }
  }

  // Delete cached value
  async delete(key: string): Promise<void> {
    if (!isConnected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      console.warn('⚠️ Cache delete failed:', error);
    }
  }

  // Cache LI.FI route response
  async cacheRoute(routeKey: string, routeData: any): Promise<void> {
    const key = `route:${routeKey}`;
    await this.set(key, routeData, this.defaultTtl.routes);
  }

  // Get cached LI.FI route
  async getCachedRoute(routeKey: string): Promise<any | null> {
    const key = `route:${routeKey}`;
    return this.get(key);
  }

  // Cache username availability check
  async cacheUsernameAvailability(username: string, isAvailable: boolean): Promise<void> {
    const key = `username:availability:${username.toLowerCase()}`;
    await this.set(key, { available: isAvailable, timestamp: Date.now() }, this.defaultTtl.username);
  }

  // Get cached username availability
  async getCachedUsernameAvailability(username: string): Promise<{ available: boolean; timestamp: number } | null> {
    const key = `username:availability:${username.toLowerCase()}`;
    return this.get(key);
  }

  // Cache user profile data
  async cacheUserProfile(walletAddress: string, profileData: any): Promise<void> {
    const key = `profile:${walletAddress}`;
    await this.set(key, profileData, this.defaultTtl.profile);
  }

  // Get cached user profile
  async getCachedUserProfile(walletAddress: string): Promise<any | null> {
    const key = `profile:${walletAddress}`;
    return this.get(key);
  }

  // Invalidate user profile cache
  async invalidateUserProfile(walletAddress: string): Promise<void> {
    const key = `profile:${walletAddress}`;
    await this.delete(key);
  }

  // Invalidate all caches for a user
  async invalidateUserCaches(walletAddress: string): Promise<void> {
    await this.invalidateUserProfile(walletAddress);
    // Add other user-related cache invalidations here
  }

  // Clear all cache (use with caution)
  async clearAll(): Promise<void> {
    if (!isConnected) return;

    try {
      await this.client.flushAll();
      console.log('🧹 Cache cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    keys: number;
  }> {
    if (!isConnected) {
      return { connected: false, memory: null, keys: 0 };
    }

    try {
      const info = await this.client.info('memory');
      const keys = await this.client.dbSize();
      
      return {
        connected: true,
        memory: info,
        keys,
      };
    } catch (error) {
      console.warn('⚠️ Cache stats failed:', error);
      return { connected: false, memory: null, keys: 0 };
    }
  }
}

// Rate limiting service
export class RateLimitService {
  private client: RedisClient;
  private readonly windowMs = config.rateLimit.windowMs; // 1 minute
  private readonly maxRequests = config.rateLimit.maxRequests; // 100 requests/minute
  private readonly maxAuthAttempts = config.rateLimit.maxAuthAttempts; // 10 auth attempts/minute

  constructor() {
    this.client = getRedisClient();
  }

  // Rate limit by IP address
  async limitByIp(ip: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    if (!isConnected) {
      // Allow all requests if Redis is down
      return { allowed: true, remaining: this.maxRequests, reset: Date.now() + this.windowMs };
    }

    const key = `ratelimit:ip:${ip}`;
    return this.limit(key, this.maxRequests, this.windowMs);
  }

  // Rate limit by user ID (for authenticated requests)
  async limitByUserId(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    if (!isConnected) {
      return { allowed: true, remaining: this.maxRequests, reset: Date.now() + this.windowMs };
    }

    const key = `ratelimit:user:${userId}`;
    return this.limit(key, this.maxRequests, this.windowMs);
  }

  // Rate limit authentication attempts
  async limitAuthAttempts(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    if (!isConnected) {
      return { allowed: true, remaining: this.maxAuthAttempts, reset: Date.now() + this.windowMs };
    }

    const key = `ratelimit:auth:${identifier}`;
    return this.limit(key, this.maxAuthAttempts, this.windowMs);
  }

  // Generic rate limiting function
  private async limit(
    key: string,
    max: number,
    windowMs: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries
      await this.client.zRemRangeByScore(key, 0, windowStart);

      // Count current window entries
      const count = await this.client.zCard(key);

      if (count >= max) {
        // Get oldest entry to calculate retry time
        const oldest = await this.client.zRangeWithScores(key, 0, 0);
        const oldestScore = oldest[0]?.score ?? now;
        const retryAfter = Math.ceil((oldestScore + windowMs - now) / 1000);

        return {
          allowed: false,
          remaining: 0,
          reset: oldestScore + windowMs,
          retryAfter,
        };
      }

      // Add current request
      await this.client.zAdd(key, { score: now, value: now.toString() });
      // Set expiry on the key
      await this.client.expire(key, Math.ceil(windowMs / 1000));

      return {
        allowed: true,
        remaining: max - count - 1,
        reset: now + windowMs,
      };
    } catch (error) {
      console.warn('⚠️ Rate limiting failed, allowing request:', error);
      return { allowed: true, remaining: max, reset: Date.now() + windowMs };
    }
  }

  // Block IP temporarily (for excessive violations)
  async blockIp(ip: string, durationMs: number): Promise<void> {
    if (!isConnected) return;

    try {
      const key = `block:ip:${ip}`;
      await this.client.set(key, 'blocked', {
        EX: Math.ceil(durationMs / 1000),
      });
    } catch (error) {
      console.warn('⚠️ IP blocking failed:', error);
    }
  }

  // Check if IP is blocked
  async isIpBlocked(ip: string): Promise<boolean> {
    if (!isConnected) return false;

    try {
      const key = `block:ip:${ip}`;
      const blocked = await this.client.get(key);
      return !!blocked;
    } catch (error) {
      console.warn('⚠️ IP block check failed:', error);
      return false;
    }
  }

  // Clear rate limit for identifier
  async clearLimit(identifier: string): Promise<void> {
    if (!isConnected) return;

    try {
      const keys = [
        `ratelimit:ip:${identifier}`,
        `ratelimit:user:${identifier}`,
        `ratelimit:auth:${identifier}`,
        `block:ip:${identifier}`,
      ];

      await this.client.del(keys);
    } catch (error) {
      console.warn('⚠️ Rate limit clear failed:', error);
    }
  }
}

// Export singleton instances
export const cacheService = new CacheService();
export const rateLimitService = new RateLimitService();
