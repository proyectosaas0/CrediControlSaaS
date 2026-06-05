import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createAdminClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Connection pool notes:
// Supabase uses pgBouncer for connection pooling at no extra cost
//
// Default limits per Supabase free tier:
// - Anon key: 5 connections per key (shared across all users)
// - Service role: 10 connections per key
// - Total pool: 100 connections
//
// For production deployments:
// 1. Go to Supabase Dashboard → Project Settings
// 2. Navigate to Database → Connection pooling
// 3. Set mode to "Transaction" (recommended for web apps)
// 4. Increase max connections if needed
//
// Transaction mode is recommended because:
// - Returns connection to pool after each transaction
// - Reduces connection churn
// - Supports more concurrent users with fewer connections
// - Better for serverless environments (Vercel, Netlify)
//
// Connection strings:
// - Direct: postgres://user:pass@host:5432/db (no pooling, for migrations)
// - Pooled: postgres://user:pass@host:6543/db (transaction mode, for apps)
