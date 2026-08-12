import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const url = new URL(request.url);
  const desde = url.searchParams.get("desde") ?? new Date().toISOString().slice(0, 10);
  const hasta = url.searchParams.get("hasta") ?? desde;
  const supabase = await createClient();
  let pagos = supabase
    .from("pagos")
    .select("monto")
    .is("anulado_at", null)
    .gte("created_at", `${desde}T00:00:00`)
    .lte("created_at", `${hasta}T23:59:59`);
  let prestamos = supabase.from("prestamos").select("id, estado, capital, total_pagar");
  // prestamos.estado never actually transitions to 'en_mora' anywhere in the
  // app (only the seed script sets it) -- real mora tracking lives in
  // mora_registros, populated by the daily /api/mora/run cron.
  let moraActiva = supabase.from("mora_registros").select("prestamo_id").eq("estado", "activa");
  let saldos = supabase.from("prestamo_saldos").select("prestamo_id, saldo_pendiente");
  if (actor!.organizationId) {
    pagos = pagos.eq("organization_id", actor!.organizationId);
    prestamos = prestamos.eq("organization_id", actor!.organizationId);
    moraActiva = moraActiva.eq("organization_id", actor!.organizationId);
    saldos = saldos.eq("organization_id", actor!.organizationId);
  }
  const [
    { data: pagosData, error: pagosError },
    { data: prestamosData, error: prestamosError },
    { data: moraData, error: moraError },
    { data: saldosData, error: saldosError },
  ] = await Promise.all([pagos, prestamos, moraActiva, saldos]);
  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);
  if (prestamosError) return apiError("INTERNAL_ERROR", prestamosError.message, 500);
  if (moraError) return apiError("INTERNAL_ERROR", moraError.message, 500);
  if (saldosError) return apiError("INTERNAL_ERROR", saldosError.message, 500);
  const prestamosActivosData = (prestamosData ?? []).filter((p) => p.estado === "activo");
  const prestamosEnMora = new Set((moraData ?? []).map((m) => m.prestamo_id)).size;
  const saldoByPrestamo = new Map((saldosData ?? []).map((s) => [s.prestamo_id, s.saldo_pendiente]));

  // Split each prestamo's outstanding balance into capital/interes
  // proportionally to its original capital/interes mix (total_pagar =
  // capital + interes at origination) -- same method used for the
  // cronograma's per-cuota capital/interes columns.
  let capitalPendiente = 0;
  let interesPendiente = 0;
  for (const p of prestamosActivosData) {
    const saldo = saldoByPrestamo.get(p.id) ?? 0;
    const totalPagar = p.total_pagar ?? p.capital;
    if (totalPagar <= 0) continue;
    capitalPendiente += saldo * (p.capital / totalPagar);
    interesPendiente += saldo * ((totalPagar - p.capital) / totalPagar);
  }

  return apiOk({
    desde,
    hasta,
    prestamosActivos: prestamosActivosData.length,
    prestamosEnMora,
    recaudoTotal: (pagosData ?? []).reduce((sum, pago) => sum + pago.monto, 0),
    capitalPendiente: Math.round(capitalPendiente),
    interesPendiente: Math.round(interesPendiente),
    totalPendiente: Math.round(capitalPendiente + interesPendiente),
  });
}
