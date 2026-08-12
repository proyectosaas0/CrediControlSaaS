import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ motivo: z.string().trim().min(3) });
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase
    .from("prestamos")
    .update({
      estado: "cancelado",
      motivo_cancelacion: parsed.data!.motivo,
      cancelado_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*");
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Prestamo no encontrado", 404);
  await supabase.rpc("audit_action", {
    p_accion: "prestamo_cancelado",
    p_actor_id: actor!.userId,
    p_actor_rol: actor!.role,
    p_entidad: "prestamos",
    p_entidad_id: id,
    p_estado_nuevo: { motivo: parsed.data!.motivo },
    p_organization_id: data.organization_id,
  });
  return apiOk(data);
}
