import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { paginationParams, parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import { withTransaction } from "@/lib/database/transactions";
import { logger } from "@/lib/logger";

const registerPaymentSchema = z.object({
  cronogramaPagoId: z.string().uuid(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  medioPago: z.enum(["efectivo", "nequi", "transferencia"]),
  monto: z.number().positive(),
  nota: z.string().trim().optional(),
  tipo: z.enum(["cuota", "parcial", "vencida", "mora", "liquidacion"]),
});

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const { page, pageSize } = paginationParams(url.searchParams);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("pagos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);
  const prestamoId = url.searchParams.get("prestamoId");
  if (prestamoId) query = query.eq("prestamo_id", prestamoId);

  const { count, data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk(data ?? [], { count: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "cobrador", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, registerPaymentSchema);
  if (parsed.response) return parsed.response;
  const input = parsed.data!;

  try {
    const result = await withTransaction(
      async (supabase) => {
        const { data: cuota, error: cuotaError } = await supabase
          .from("cronograma_pagos")
          .select("id, organization_id, prestamo_id, cobrador_id")
          .eq("id", input.cronogramaPagoId)
          .eq("organization_id", actor!.organizationId)
          .maybeSingle();
        if (cuotaError) throw cuotaError;
        if (!cuota) return { error: apiError("NOT_FOUND", "Cuota no encontrada", 404) };
        if (actor!.role === "cobrador" && cuota.cobrador_id !== actor!.userId) {
          return { error: apiError("FORBIDDEN", "Cuota no asignada al cobrador", 403) };
        }

        const { data: prestamo, error: prestamoError } = await supabase
          .from("prestamos")
          .select("cliente_id")
          .eq("id", cuota.prestamo_id)
          .eq("organization_id", actor!.organizationId)
          .maybeSingle();
        if (prestamoError) throw prestamoError;
        if (!prestamo) return { error: apiError("NOT_FOUND", "Prestamo no encontrado", 404) };

        const { data: pagoId, error } = await supabase.rpc("register_payment", {
          p_cliente_id: prestamo.cliente_id,
          p_cobrador_id: cuota.cobrador_id ?? actor!.userId,
          p_cronograma_pago_id: cuota.id,
          p_lat: input.lat ?? null,
          p_lng: input.lng ?? null,
          p_medio_pago: input.medioPago,
          p_monto: input.monto,
          p_nota: input.nota ?? null,
          p_organization_id: actor!.organizationId,
          p_prestamo_id: cuota.prestamo_id,
          p_registrado_por: actor!.userId,
          p_tipo: input.tipo,
        });

        if (error) throw error;
        return { pagoId };
      },
      { userId: actor!.userId, organizationId: actor!.organizationId }
    );

    if (result.error) return result.error;
    return apiOk({ id: result.pagoId }, {}, 201);
  } catch (error) {
    logger.error({ error: String(error), actor: actor!.userId }, "Payment registration failed");
    return apiError("INTERNAL_ERROR", "Error al registrar pago", 500);
  }
}
