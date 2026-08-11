import { apiError } from "@/lib/api/errors";
import type { AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, rol, activo, organizations(estado_suscripcion, trial_hasta)")
    .eq("id", actor.userId)
    .maybeSingle();

  if (error) {
    return { actor: null, response: apiError("INTERNAL_ERROR", error.message, 500) };
  }

  if (!profile?.activo) {
    return { actor: null, response: apiError("FORBIDDEN", "Usuario inactivo", 403) };
  }

  actor.role = actor.role ?? profile.rol;
  actor.organizationId = actor.organizationId ?? profile.organization_id;

  if (!actor.role || (roles && !roles.includes(actor.role))) {
    return { actor: null, response: apiError("FORBIDDEN", "Rol no autorizado", 403) };
  }

  // Enforcement de suscripción eliminado — permitimos llamadas API independientemente
  // del estado de suscripción.

  // Super admin can impersonate an org via the active-org-id cookie
  if (actor.role === "super_admin" && !actor.organizationId) {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active-org-id")?.value ?? null;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (activeOrgId && UUID_RE.test(activeOrgId)) actor.organizationId = activeOrgId;
  }

  return { actor, response: null };
}
