import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/server/admin-supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const { id } = await context.params;
  const { data, error } = await createAdminClient().from("organizations").update({ estado_suscripcion: "suspendido" }).eq("id", id).select("*").maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Tenant no encontrado", 404);
  return apiOk(data);
}
