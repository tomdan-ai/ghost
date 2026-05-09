import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { config } from './env';

// Lazy-loaded instances for better startup performance and testability
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;
let supabaseClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey
    );
  }
  return supabaseInstance;
};

export const getSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient<Database>(
      config.supabase.url,
      config.supabase.anonKey
    );
  }
  return supabaseClientInstance;
};

// Proxy exports for backward compatibility — lazily initialised on first use
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: (_target, prop) => (getSupabase() as any)[prop],
});

// Client for user-facing operations (with anon key)
export const supabaseClient = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: (_target, prop) => (getSupabaseClient() as any)[prop],
});
