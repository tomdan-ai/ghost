import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;
let supabaseClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }
  return supabaseInstance;
};

export const getSupabaseClient = () => {
  if (!supabaseClientInstance) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
};

// For backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: (target, prop) => {
    return (getSupabase() as any)[prop];
  }
});

export const supabaseClient = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get: (target, prop) => {
    return (getSupabaseClient() as any)[prop];
  }
});
