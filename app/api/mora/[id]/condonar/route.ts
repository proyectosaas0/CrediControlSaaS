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
    .from("mora_registros")
    .update({
      estado: "condonada",
      motivo_condonacion: parsed.data!.motivo,
      condonado_por: actor!.userId,
      condonado_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*");
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Mora no encontrada", 404);
  return apiOk(data);
}
