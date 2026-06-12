import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin-supabase";

const updateCobradorSchema = z.object({
  nombre_completo: z.string().trim().min(1).optional(),
  telefono: z.string().trim().min(7).optional(),
  activo: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

const SELECT = "id, nombre_completo, telefono, activo, rol";

export async function GET(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase.from("profiles").select(SELECT).eq("id", id).eq("rol", "cobrador");

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);

  const { data, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Cobrador no encontrado", 404);

  return apiOk(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, updateCobradorSchema);
  if (parsed.response) return parsed.response;

  const { id } = await context.params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .update(parsed.data!)
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .eq("rol", "cobrador")
    .select(SELECT)
    .maybeSingle();

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Cobrador no encontrado", 404);

  return apiOk(data);
}
