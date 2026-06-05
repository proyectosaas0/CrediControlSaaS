import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const dias = Number(new URL(request.url).searchParams.get("dias") ?? "30");
  const desde = new Date();
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + (Number.isFinite(dias) ? dias : 30));
  const supabase = await createClient();
  let query = supabase.from("cronograma_pagos").select("monto_esperado").in("estado", ["pendiente", "parcial"]).gte("fecha_esperada", desde.toISOString().slice(0, 10)).lte("fecha_esperada", hasta.toISOString().slice(0, 10));
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk({ dias, total: (data ?? []).reduce((sum, row) => sum + row.monto_esperado, 0) });
}
