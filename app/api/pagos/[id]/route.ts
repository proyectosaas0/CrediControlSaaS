import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const { id } = await context.params;
  const supabase = await createClient();

  let query = supabase
    .from("pagos")
    .select(
      "id, monto, medio_pago, tipo, nota, created_at, prestamo_id, cliente_id, cobrador_id, cronograma_pago_id, lat, lng, organization_id, clientes(nombre)",
    )
    .eq("id", id);

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);

  const { data: pago, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!pago) return apiError("NOT_FOUND", "Pago no encontrado", 404);

  const [{ data: cobrador }, { data: prestamo }, cuotaResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre_completo")
      .eq("id", pago.cobrador_id)
      .maybeSingle(),
    supabase
      .from("prestamos")
      .select("capital, modelo_interes, tasa_mensual")
      .eq("id", pago.prestamo_id)
      .maybeSingle(),
    pago.cronograma_pago_id
      ? supabase
          .from("cronograma_pagos")
          .select("numero_cuota, monto_esperado")
          .eq("id", pago.cronograma_pago_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return apiOk({
    ...pago,
    cobrador_nombre: cobrador?.nombre_completo ?? null,
    prestamo,
    cuota: cuotaResult.data ?? null,
  });
}

const updateSchema = z.object({
  medioPago: z.enum(["efectivo", "nequi", "transferencia"]),
  nota: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;

  const { id } = await context.params;
  const parsed = await parseJson(request, updateSchema);
  if (parsed.response) return parsed.response;
  const input = parsed.data!;

  const supabase = await createClient();

  let verifyQ = supabase
    .from("pagos")
    .select("id, cronograma_pago_id")
    .eq("id", id);
  if (actor!.organizationId) verifyQ = verifyQ.eq("organization_id", actor!.organizationId);

  const { data: existing, error: fetchErr } = await verifyQ.maybeSingle();
  if (fetchErr) return apiError("INTERNAL_ERROR", fetchErr.message, 500);
  if (!existing) return apiError("NOT_FOUND", "Pago no encontrado", 404);

  type MedioPago = "efectivo" | "nequi" | "transferencia";
  type PagoUpdate = { medio_pago: MedioPago; nota?: string | null };
  const updates: PagoUpdate = { medio_pago: input.medioPago as MedioPago };
  if (input.nota !== undefined) updates.nota = input.nota || null;

  const { error } = await supabase.from("pagos").update(updates).eq("id", id);
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  if (existing.cronograma_pago_id) {
    await supabase
      .from("cronograma_pagos")
      .update({ medio_pago: input.medioPago })
      .eq("id", existing.cronograma_pago_id);
  }

  return apiOk({ id });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const organizationId = actor!.organizationId;
  if (!organizationId) return apiError("FORBIDDEN", "Sin organización", 403);

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: pago, error: fetchErr } = await supabase
    .from("pagos")
    .select("id, monto, prestamo_id, cronograma_pago_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (fetchErr) return apiError("INTERNAL_ERROR", fetchErr.message, 500);
  if (!pago) return apiError("NOT_FOUND", "Pago no encontrado", 404);

  const { data: saldo, error: saldoErr } = await supabase
    .from("prestamo_saldos")
    .select("total_pagado, saldo_pendiente")
    .eq("prestamo_id", pago.prestamo_id)
    .maybeSingle();

  if (saldoErr) return apiError("INTERNAL_ERROR", saldoErr.message, 500);

  const [deleteResult] = await Promise.all([
    supabase.from("pagos").delete().eq("id", id),
    saldo
      ? supabase.from("prestamo_saldos").update({
          total_pagado: Math.max(0, saldo.total_pagado - pago.monto),
          saldo_pendiente: saldo.saldo_pendiente + pago.monto,
          updated_at: new Date().toISOString(),
        }).eq("prestamo_id", pago.prestamo_id)
      : Promise.resolve({ error: null }),
    pago.cronograma_pago_id
      ? supabase
          .from("cronograma_pagos")
          .update({ estado: "pendiente", fecha_pago: null, monto_pagado: 0 })
          .eq("id", pago.cronograma_pago_id)
          .eq("estado", "pagado")
      : Promise.resolve({ error: null }),
  ]);

  if (deleteResult.error) return apiError("INTERNAL_ERROR", deleteResult.error.message, 500);

  return apiOk({ id });
}
