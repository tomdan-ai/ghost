import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define the environment schema using Zod for validation
const envSchema = z.object({
  // Supabase configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  
  // Redis configuration
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').default('redis://localhost:6379'),
  
  // LI.FI API configuration
  LIFI_API_KEY: z.string().min(1, 'LIFI_API_KEY is required'),
  
  // Solana configuration
  SOLANA_RPC_URL: z.string().url('SOLANA_RPC_URL must be a valid URL').default('https://api.mainnet-beta.solana.com'),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // Server configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // CORS configuration
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL').default('http://localhost:3000'),
  
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/, 'RATE_LIMIT_WINDOW_MS must be a number').default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/, 'RATE_LIMIT_MAX_REQUESTS must be a number').default('100'),
  RATE_LIMIT_MAX_AUTH_ATTEMPTS: z.string().regex(/^\d+$/, 'RATE_LIMIT_MAX_AUTH_ATTEMPTS must be a number').default('10'),
  
  // Cache configuration
  CACHE_TTL_ROUTES_MS: z.string().regex(/^\d+$/, 'CACHE_TTL_ROUTES_MS must be a number').default('300000'),
  CACHE_TTL_USERNAME_MS: z.string().regex(/^\d+$/, 'CACHE_TTL_USERNAME_MS must be a number').default('60000'),
  CACHE_TTL_PROFILE_MS: z.string().regex(/^\d+$/, 'CACHE_TTL_PROFILE_MS must be a number').default('600000'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      console.error('❌ Environment validation failed:');
      console.error(errorMessages);
      console.error('\n💡 Please check your .env file or environment variables.');
      console.error('   Refer to .env.example for required variables.');
      
      process.exit(1);
    }
    
    console.error('❌ Unexpected error during environment validation:', error);
    process.exit(1);
  }
};

// Export validated environment variables
export const env = parseEnv();

// Export type for TypeScript
export type Env = z.infer<typeof envSchema>;

// Helper function to get environment-specific configuration
export const getConfig = () => {
  const isProduction = env.NODE_ENV === 'production';
  const isDevelopment = env.NODE_ENV === 'development';
  const isTest = env.NODE_ENV === 'test';
  
  return {
    ...env,
    isProduction,
    isDevelopment,
    isTest,
    
    // Server configuration
    server: {
      port: parseInt(env.PORT, 10),
      corsOrigin: env.CORS_ORIGIN,
      nodeEnv: env.NODE_ENV,
    },
    
    // Supabase configuration
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    
    // Redis configuration
    redis: {
      url: env.REDIS_URL,
    },
    
    // Rate limiting configuration
    rateLimit: {
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
      maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
      maxAuthAttempts: parseInt(env.RATE_LIMIT_MAX_AUTH_ATTEMPTS, 10),
    },
    
    // Cache configuration
    cache: {
      routesTtlMs: parseInt(env.CACHE_TTL_ROUTES_MS, 10),
      usernameTtlMs: parseInt(env.CACHE_TTL_USERNAME_MS, 10),
      profileTtlMs: parseInt(env.CACHE_TTL_PROFILE_MS, 10),
    },
    
    // External services
    external: {
      lifiApiKey: env.LIFI_API_KEY,
      solanaRpcUrl: env.SOLANA_RPC_URL,
    },
    
    // Security
    security: {
      jwtSecret: env.JWT_SECRET,
    },
  };
};

// Export the configuration
export const config = getConfig();

// Log environment validation success (only in development)
if (config.isDevelopment) {
  console.log('✅ Environment validation successful');
  console.log(`   NODE_ENV: ${config.server.nodeEnv}`);
  console.log(`   Server running on port: ${config.server.port}`);
  console.log(`   CORS Origin: ${config.server.corsOrigin}`);
}
