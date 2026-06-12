import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase
    .from("prestamos")
    .select("*, clientes(nombre), prestamo_saldos(*)")
    .eq("id", id);
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);

  const [{ data, error }, { data: cuotas }] = await Promise.all([
    query.maybeSingle(),
    supabase
      .from("cronograma_pagos")
      .select("estado")
      .eq("prestamo_id", id)
      .neq("estado", "cancelado"),
  ]);

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Prestamo no encontrado", 404);

  const cuotasTotales = cuotas?.length ?? 0;
  const cuotasPagadas = cuotas?.filter((c) => c.estado === "pagado").length ?? 0;
  const saldoRow = data.prestamo_saldos?.[0] ?? null;

  return apiOk({
    ...data,
    prestamo_saldos: [
      {
        ...(saldoRow ?? {}),
        prestamo_id: id,
        cuotas_pagadas: cuotasPagadas,
        cuotas_totales: cuotasTotales,
        saldo_pendiente: saldoRow?.saldo_pendiente ?? 0,
      },
    ],
  });
}
