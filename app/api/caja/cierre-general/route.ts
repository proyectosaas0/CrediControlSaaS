import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const supabase = await createClient();
  const { data, error } = await supabase.from("cierres_caja").select("total_recaudado, efectivo_declarado").eq("organization_id", actor!.organizationId).eq("fecha", parsed.data!.fecha);
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk({ efectivoDeclarado: (data ?? []).reduce((s, r) => s + (r.efectivo_declarado ?? 0), 0), fecha: parsed.data!.fecha, totalRecaudado: (data ?? []).reduce((s, r) => s + (r.total_recaudado ?? 0), 0) });
}
