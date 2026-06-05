import { apiError } from "@/lib/api/errors";
import type { AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ApiActor = {
  userId: string;
  role: AppRole;
  organizationId: string | null;
};

export async function requireApiActor(roles?: AppRole[]) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { actor: null, response: apiError("UNAUTHENTICATED", "No autenticado", 401) };
  }

  const actor: ApiActor = {
    userId: String(claimsData.claims.sub),
    role: claimsData.claims.rol as AppRole,
    organizationId: (claimsData.claims.organization_id as string | null | undefined) ?? null,
  };

  if (!actor.role || (roles && !roles.includes(actor.role))) {
    return { actor: null, response: apiError("FORBIDDEN", "Rol no autorizado", 403) };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("activo")
    .eq("id", actor.userId)
    .maybeSingle();

  if (error) {
    return { actor: null, response: apiError("INTERNAL_ERROR", error.message, 500) };
  }

  if (!profile?.activo) {
    return { actor: null, response: apiError("FORBIDDEN", "Usuario inactivo", 403) };
  }

  return { actor, response: null };
}
