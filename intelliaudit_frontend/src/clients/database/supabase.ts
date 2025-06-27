import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Log the Supabase URL to help with debugging
console.log(`Connecting to Supabase at: ${supabaseUrl}`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
  }
});
