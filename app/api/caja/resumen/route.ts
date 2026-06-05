import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha") ?? new Date().toISOString().slice(0, 10);
  const cobradorId = actor!.role === "cobrador" ? actor!.userId : url.searchParams.get("cobradorId");
  const supabase = await createClient();
  let pagos = supabase.from("pagos").select("monto, medio_pago").eq("organization_id", actor!.organizationId).gte("created_at", `${fecha}T00:00:00`).lte("created_at", `${fecha}T23:59:59`);
  let cuotas = supabase.from("cronograma_pagos").select("monto_esperado").eq("organization_id", actor!.organizationId).eq("fecha_esperada", fecha);
  if (cobradorId) {
    pagos = pagos.eq("cobrador_id", cobradorId);
    cuotas = cuotas.eq("cobrador_id", cobradorId);
  }
  const [{ data: pagosData, error: pagosError }, { data: cuotasData, error: cuotasError }] = await Promise.all([pagos, cuotas]);
  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);
  if (cuotasError) return apiError("INTERNAL_ERROR", cuotasError.message, 500);
  const totalRecaudado = (pagosData ?? []).reduce((sum, pago) => sum + pago.monto, 0);
  const totalEsperado = (cuotasData ?? []).reduce((sum, cuota) => sum + cuota.monto_esperado, 0);
  return apiOk({ diferencia: totalRecaudado - totalEsperado, fecha, totalEsperado, totalRecaudado });
}
