import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function serviceClient(): SupabaseClient<Database> {
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function clientAs(email: string): Promise<SupabaseClient<Database>> {
  const supabase = anonClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: "Password123!" });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return supabase;
}
