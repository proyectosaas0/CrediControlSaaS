import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const updateClienteSchema = z.object({
  activo: z.boolean().optional(),
  barrio: z.string().trim().optional(),
  cedula: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  nombre: z.string().trim().min(1).optional(),
  notas: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("id, organization_id, nombre, cedula, telefono, direccion, barrio, notas, score_pago, activo, created_at")
    .eq("id", id);

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);

  const { data, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Cliente no encontrado", 404);

  return apiOk(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, updateClienteSchema);
  if (parsed.response) return parsed.response;

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .update(parsed.data!)
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .select("id, organization_id, nombre, cedula, telefono, direccion, barrio, notas, score_pago, activo, created_at")
    .maybeSingle();

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Cliente no encontrado", 404);

  return apiOk(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .update({ activo: false })
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .select("id, organization_id, nombre, cedula, telefono, direccion, barrio, notas, score_pago, activo, created_at")
    .maybeSingle();

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Cliente no encontrado", 404);

  return apiOk(data);
}
