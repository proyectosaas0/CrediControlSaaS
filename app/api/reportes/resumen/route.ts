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
  let pagos = supabase.from("pagos").select("monto").gte("created_at", `${desde}T00:00:00`).lte("created_at", `${hasta}T23:59:59`);
  let prestamos = supabase.from("prestamos").select("id, estado, capital");
  if (actor!.organizationId) {
    pagos = pagos.eq("organization_id", actor!.organizationId);
    prestamos = prestamos.eq("organization_id", actor!.organizationId);
  }
  const [{ data: pagosData, error: pagosError }, { data: prestamosData, error: prestamosError }] = await Promise.all([pagos, prestamos]);
  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);
  if (prestamosError) return apiError("INTERNAL_ERROR", prestamosError.message, 500);
  const prestamosActivosData = (prestamosData ?? []).filter((p) => p.estado === "activo");
  return apiOk({
    desde,
    hasta,
    prestamosActivos: prestamosActivosData.length,
    prestamosEnMora: (prestamosData ?? []).filter((p) => p.estado === "en_mora").length,
    recaudoTotal: (pagosData ?? []).reduce((sum, pago) => sum + pago.monto, 0),
    capitalActivo: prestamosActivosData.reduce((sum, p) => sum + p.capital, 0),
  });
}
