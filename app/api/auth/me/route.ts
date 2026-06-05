import { apiError, apiOk } from "@/lib/api/errors";
import { requireApiActor } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, nombre_completo, rol, telefono, activo, ultimo_acceso")
    .eq("id", actor!.userId)
    .maybeSingle();

  if (profileError) return apiError("INTERNAL_ERROR", profileError.message, 500);

  const { data: organization, error: organizationError } = actor!.organizationId
    ? await supabase
        .from("organizations")
        .select("id, nombre_negocio, logo_url, ciudad, telefono, plan, estado_suscripcion, trial_hasta, created_at")
        .eq("id", actor!.organizationId)
        .maybeSingle()
    : { data: null, error: null };

  if (organizationError) return apiError("INTERNAL_ERROR", organizationError.message, 500);

  return apiOk({ actor, organization, profile, settings: null, subscription: null });
}
