import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const today = new Date().toISOString().slice(0, 10);
  const desde = url.searchParams.get("desde") ?? today;
  const hasta = url.searchParams.get("hasta") ?? today;

  const supabase = await createClient();

  let pagosQ = supabase
    .from("pagos")
    .select("monto, created_at")
    .gte("created_at", `${desde}T00:00:00`)
    .lte("created_at", `${hasta}T23:59:59`);

  let cuotasQ = supabase
    .from("cronograma_pagos")
    .select("monto_esperado, fecha_esperada")
    .gte("fecha_esperada", desde)
    .lte("fecha_esperada", hasta);

  if (actor!.organizationId) {
    pagosQ = pagosQ.eq("organization_id", actor!.organizationId);
    cuotasQ = cuotasQ.eq("organization_id", actor!.organizationId);
  }

  const [{ data: pagos, error: pagosError }, { data: cuotas, error: cuotasError }] =
    await Promise.all([pagosQ, cuotasQ]);

  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);
  if (cuotasError) return apiError("INTERNAL_ERROR", cuotasError.message, 500);

  const recaudadoByDate = new Map<string, number>();
  for (const p of pagos ?? []) {
    const fecha = p.created_at.slice(0, 10);
    recaudadoByDate.set(fecha, (recaudadoByDate.get(fecha) ?? 0) + p.monto);
  }

  const esperadoByDate = new Map<string, number>();
  for (const c of cuotas ?? []) {
    const fecha = c.fecha_esperada;
    esperadoByDate.set(fecha, (esperadoByDate.get(fecha) ?? 0) + c.monto_esperado);
  }

  const result: { fecha: string; recaudado: number; esperado: number }[] = [];
  const current = new Date(desde);
  const end = new Date(hasta);
  while (current <= end) {
    const fecha = current.toISOString().slice(0, 10);
    result.push({
      fecha,
      recaudado: recaudadoByDate.get(fecha) ?? 0,
      esperado: esperadoByDate.get(fecha) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return apiOk(result, { desde, hasta });
}
