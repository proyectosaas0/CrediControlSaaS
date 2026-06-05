import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createAdminClient } from "@/lib/server/admin-supabase";

const schema = z.object({ ciudad: z.string().nullable().optional(), nombreNegocio: z.string().trim().min(1).optional(), telefono: z.string().nullable().optional() });
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const { id } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").select("*").eq("id", id).maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Tenant no encontrado", 404);
  return apiOk(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const { id } = await context.params;
  const admin = createAdminClient();
  const update = { ciudad: parsed.data!.ciudad, nombre_negocio: parsed.data!.nombreNegocio, telefono: parsed.data!.telefono };
  const { data, error } = await admin.from("organizations").update(update).eq("id", id).select("*").maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Tenant no encontrado", 404);
  return apiOk(data);
}
