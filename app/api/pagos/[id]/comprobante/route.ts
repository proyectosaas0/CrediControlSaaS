import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { buildReceiptMessage } from "@/lib/domain/whatsapp";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const { id } = await context.params;
  const supabase = await createClient();
  let query = supabase.from("pagos").select("*").eq("id", id);
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);

  const { data: pago, error } = await query.maybeSingle();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!pago) return apiError("NOT_FOUND", "Pago no encontrado", 404);

  const [{ data: org }, { data: cliente }, { data: cobrador }, { data: saldo }, { data: cuota }] = await Promise.all([
    supabase.from("organizations").select("nombre_negocio").eq("id", pago.organization_id).maybeSingle(),
    supabase.from("clientes").select("nombre").eq("id", pago.cliente_id).maybeSingle(),
    supabase.from("profiles").select("nombre_completo").eq("id", pago.cobrador_id).maybeSingle(),
    supabase.from("prestamo_saldos").select("saldo_pendiente").eq("prestamo_id", pago.prestamo_id).maybeSingle(),
    pago.cronograma_pago_id
      ? supabase.from("cronograma_pagos").select("numero_cuota").eq("id", pago.cronograma_pago_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const message = buildReceiptMessage({
    cliente: cliente?.nombre ?? "Cliente",
    cobrador: cobrador?.nombre_completo ?? "Cobrador",
    cuota: cuota?.numero_cuota ? `${cuota.numero_cuota}` : "N/A",
    fecha: new Date(pago.created_at).toLocaleString("es-CO"),
    medioPago: pago.medio_pago,
    monto: pago.monto,
    negocio: org?.nombre_negocio ?? "CrediControl",
    saldo: saldo?.saldo_pendiente ?? 0,
    ubicacion: pago.lat && pago.lng ? `${pago.lat},${pago.lng}` : undefined,
  });

  return apiOk({
    message,
    pago,
    cliente: cliente?.nombre ?? null,
    cobrador: cobrador?.nombre_completo ?? null,
    negocio: org?.nombre_negocio ?? null,
    saldo: saldo?.saldo_pendiente ?? null,
    cuota: cuota?.numero_cuota ?? null,
  });
}
