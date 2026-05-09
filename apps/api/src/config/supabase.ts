import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { config } from './env';

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// Client for user-facing operations (with anon key)
export const supabaseClient = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey
);
