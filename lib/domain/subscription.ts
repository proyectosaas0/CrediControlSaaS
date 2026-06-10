export type EstadoSuscripcion = "activo" | "trial" | "vencido" | "suspendido";

/**
 * ¿Puede operar este tenant?
 * - activo: sí
 * - trial: solo si hoy <= trial_hasta (comparación de fechas YYYY-MM-DD)
 * - vencido / suspendido / desconocido: no
 * `today` se inyecta para tests deterministas; default = hoy en UTC.
 */
export function isSubscriptionActive(params: {
  estado: string;
  trialHasta: string | null;
  today?: string;
}): boolean {
  const { estado, trialHasta } = params;
  const today = params.today ?? new Date().toISOString().slice(0, 10);

  if (estado === "activo") return true;
  if (estado === "trial") {
    if (!trialHasta) return false;
    return today <= trialHasta; // ISO date strings comparan lexicográficamente
  }
  return false; // vencido, suspendido, desconocido
}
