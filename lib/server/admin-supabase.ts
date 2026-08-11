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

// NEXT_PUBLIC_APP_URL must be set to the real deployed domain (not
// localhost) for links in auth emails to land somewhere real. Throws
// instead of silently building a localhost/undefined link.
function setPasswordRedirectUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL no esta configurada -- el link del correo no puede generarse",
    );
  }
  return `${appUrl}/set-password`;
}

// createUser({ email_confirm: true }) never sends an email and leaves the
// account without a password -- inviteUserByEmail() is the call that
// actually emails a "create your password" link.
export async function inviteUser(
  admin: SupabaseClient<Database>,
  email: string,
  metadata: Record<string, unknown>,
) {
  return admin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    redirectTo: setPasswordRedirectUrl(),
  });
}

// generateLink({ type: "recovery" }) does NOT send an email either -- it
// only returns the link for you to deliver yourself. resetPasswordForEmail()
// is the call that actually triggers Supabase's recovery email.
export async function sendPasswordRecovery(admin: SupabaseClient<Database>, email: string) {
  return admin.auth.resetPasswordForEmail(email, {
    redirectTo: setPasswordRedirectUrl(),
  });
}
