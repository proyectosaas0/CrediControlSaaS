import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createAdminClient } from "@/lib/server/admin-supabase";

const schema = z.object({ trialHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const { id } = await context.params;
  const { data, error } = await createAdminClient().from("organizations").update({ trial_hasta: parsed.data!.trialHasta }).eq("id", id).select("*").maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Tenant no encontrado", 404);
  return apiOk(data);
}
