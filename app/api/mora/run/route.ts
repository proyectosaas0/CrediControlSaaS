import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/server/admin-supabase";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const { actor, response } = secret === process.env.CRON_SECRET ? { actor: null, response: null } : await requireApiActor(["super_admin"]);
  if (response) return response;

  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const { data: cuotas, error } = await admin
    .from("cronograma_pagos")
    .select("prestamo_id, organization_id, fecha_esperada, monto_esperado, monto_pagado")
    .lt("fecha_esperada", today)
    .in("estado", ["pendiente", "parcial"]);
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  const rows = (cuotas ?? []).map((cuota) => ({
    dias_mora: Math.max(1, Math.ceil((Date.parse(today) - Date.parse(cuota.fecha_esperada)) / 86400000)),
    fecha_inicio_mora: cuota.fecha_esperada,
    monto_mora: Math.max(0, cuota.monto_esperado - cuota.monto_pagado),
    organization_id: cuota.organization_id,
    prestamo_id: cuota.prestamo_id,
  }));
  if (rows.length > 0) {
    const { error: insertError } = await admin.from("mora_registros").insert(rows);
    if (insertError) return apiError("INTERNAL_ERROR", insertError.message, 500);
  }
  return apiOk({ actor, processed: rows.length });
}
