import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin env vars missing");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// createUser({ email_confirm: true }) never sends an email and leaves the
// account without a password -- inviteUserByEmail() is the call that
// actually emails an "create your password" link. NEXT_PUBLIC_APP_URL must
// be set to the real deployed domain (not localhost) for that link to work;
// falls back to /set-password relative to nothing useful if it's missing,
// so a misconfigured env is loud instead of silently mailing a localhost link.
export async function inviteUser(
  admin: SupabaseClient<Database>,
  email: string,
  metadata: Record<string, unknown>,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL no esta configurada -- el link de invitacion no puede generarse",
    );
  }

  return admin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    redirectTo: `${appUrl}/set-password`,
  });
}
