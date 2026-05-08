import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Client for user-facing operations (with anon key)
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY!
);
