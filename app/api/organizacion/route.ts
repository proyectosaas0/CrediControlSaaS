import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createAdminClient } from "@/lib/server/admin-supabase";
import { organizacionSettingsSchema } from "@/lib/schemas/admin";

export async function PATCH(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, organizacionSettingsSchema);
  if (parsed.response) return parsed.response;

  const input = parsed.data!;
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("organizations")
    .select("*")
    .eq("id", actor!.organizationId)
    .maybeSingle();
  if (existingError) return apiError("INTERNAL_ERROR", existingError.message, 500);
  if (!existing) return apiError("NOT_FOUND", "Organizacion no encontrada", 404);

  const { data: updated, error } = await admin
    .from("organizations")
    .update({
      nombre_negocio: input.nombreNegocio,
      ciudad: input.ciudad || null,
      telefono: input.telefono || null,
      horario_inicio: input.horarioInicio || null,
      horario_fin: input.horarioFin || null,
      moneda: input.moneda,
      cobrar_sabados: input.cobrarSabados,
      cobrar_domingos: input.cobrarDomingos,
      geolocalizacion_requerida: input.geolocalizacionRequerida,
      whatsapp_template: input.whatsappTemplate || null,
      color_primario: input.colorPrimario || null,
    })
    .eq("id", actor!.organizationId)
    .select(
      "id, nombre_negocio, logo_url, ciudad, telefono, plan, estado_suscripcion, trial_hasta, created_at, horario_inicio, horario_fin, moneda, cobrar_sabados, cobrar_domingos, geolocalizacion_requerida, whatsapp_template, color_primario",
    )
    .single();

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  await admin.rpc("audit_action", {
    p_accion: "organizacion_editada",
    p_actor_id: actor!.userId,
    p_actor_rol: actor!.role,
    p_entidad: "organizations",
    p_entidad_id: actor!.organizationId,
    p_estado_anterior: existing,
    p_estado_nuevo: updated,
    p_organization_id: actor!.organizationId,
  });

  return apiOk(updated);
}
