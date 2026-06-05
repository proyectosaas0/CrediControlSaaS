import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ monto: z.number().positive() });
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase.from("mora_registros").select("monto_pagado_mora, monto_mora").eq("id", id);
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data: mora, error: readError } = await query.maybeSingle();
  if (readError) return apiError("INTERNAL_ERROR", readError.message, 500);
  if (!mora) return apiError("NOT_FOUND", "Mora no encontrada", 404);
  const nuevoPagado = mora.monto_pagado_mora + parsed.data!.monto;
  const { data, error } = await supabase
    .from("mora_registros")
    .update({ estado: nuevoPagado >= (mora.monto_mora ?? 0) ? "pagada" : "activa", monto_pagado_mora: nuevoPagado })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data);
}
