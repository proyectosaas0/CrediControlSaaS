import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ cobradorId: z.string().uuid().optional(), efectivoDeclarado: z.number().nonnegative(), fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "cobrador", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const cobradorId = actor!.role === "cobrador" ? actor!.userId : parsed.data!.cobradorId;
  if (!cobradorId) return apiError("VALIDATION_ERROR", "cobradorId requerido", 422);
  const supabase = await createClient();
  const { data: pagos } = await supabase.from("pagos").select("monto").eq("organization_id", actor!.organizationId).eq("cobrador_id", cobradorId).gte("created_at", `${parsed.data!.fecha}T00:00:00`).lte("created_at", `${parsed.data!.fecha}T23:59:59`);
  const totalRecaudado = (pagos ?? []).reduce((sum, pago) => sum + pago.monto, 0);
  const { data, error } = await supabase.from("cierres_caja").insert({ cerrado_por: actor!.userId, cobrador_id: cobradorId, efectivo_declarado: parsed.data!.efectivoDeclarado, fecha: parsed.data!.fecha, organization_id: actor!.organizationId, total_recaudado: totalRecaudado }).select("*").single();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data, {}, 201);
}
