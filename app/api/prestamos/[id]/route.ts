import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { buildLoanSchedule, calculateLoanTotals } from "@/lib/domain/loans";
import { createAdminClient } from "@/lib/server/admin-supabase";
import { createClient } from "@/lib/supabase/server";
import { editarPrestamoSchema } from "@/lib/schemas/admin";

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
  const saldoRow = Array.isArray(data.prestamo_saldos)
    ? (data.prestamo_saldos[0] ?? null)
    : (data.prestamo_saldos ?? null);

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

export async function PATCH(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, editarPrestamoSchema);
  if (parsed.response) return parsed.response;

  const { id } = await context.params;
  const input = parsed.data!;
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("prestamos")
    .select("id, organization_id, cliente_id, cobrador_id, estado, capital, modelo_interes, tasa_mensual, plazo_dias, fecha_inicio, excluir_sabados, excluir_domingos")
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .maybeSingle();
  if (existingError) return apiError("INTERNAL_ERROR", existingError.message, 500);
  if (!existing) return apiError("NOT_FOUND", "Prestamo no encontrado", 404);

  const { count: pagosCount, error: pagosError } = await admin
    .from("pagos")
    .select("id", { count: "exact", head: true })
    .eq("prestamo_id", id)
    .eq("organization_id", actor!.organizationId);
  if (pagosError) return apiError("INTERNAL_ERROR", pagosError.message, 500);

  const financialChanges =
    existing.capital !== input.capital ||
    existing.modelo_interes !== input.modeloInteres ||
    existing.tasa_mensual !== input.tasaMensual ||
    existing.plazo_dias !== input.plazoDias ||
    existing.fecha_inicio !== input.fechaInicio ||
    existing.excluir_sabados !== input.excluirSabados ||
    existing.excluir_domingos !== input.excluirDomingos;

  if ((pagosCount ?? 0) > 0 && financialChanges) {
    return apiError(
      "CONFLICT",
      "No se pueden cambiar capital, tasa, plazo o cronograma cuando ya hay pagos registrados",
      409,
      { pagosRegistrados: pagosCount ?? 0, financialChanges: true },
    );
  }

  const basicUpdate = {
    cliente_id: input.clienteId,
    cobrador_id: input.cobradorId || null,
    dia_cobro: input.diaCobro || null,
  };

  if ((pagosCount ?? 0) > 0 && !financialChanges) {
    const { data: updated, error: updateError } = await admin
      .from("prestamos")
      .update(basicUpdate)
      .eq("id", id)
      .eq("organization_id", actor!.organizationId)
      .select("*")
      .single();
    if (updateError) return apiError("INTERNAL_ERROR", updateError.message, 500);

    await admin.rpc("audit_action", {
      p_accion: "prestamo_editado",
      p_actor_id: actor!.userId,
      p_actor_rol: actor!.role,
      p_entidad: "prestamos",
      p_entidad_id: id,
      p_estado_anterior: existing,
      p_estado_nuevo: updated,
      p_organization_id: actor!.organizationId,
    });

    return apiOk(updated, { cuotas: existing.plazo_dias });
  }

  const totals = calculateLoanTotals({
    capital: input.capital,
    modelo: input.modeloInteres,
    plazoDias: input.plazoDias,
    tasaMensual: input.tasaMensual,
  });
  const schedule = buildLoanSchedule({
    capital: input.capital,
    excluirDomingos: input.excluirDomingos,
    excluirSabados: input.excluirSabados,
    fechaInicio: input.fechaInicio,
    modelo: input.modeloInteres,
    plazoDias: input.plazoDias,
    tasaMensual: input.tasaMensual,
  });

  const { data: updated, error: updateError } = await admin
    .from("prestamos")
    .update({
      capital: input.capital,
      ...basicUpdate,
      cuota_diaria: totals.cuotaDiaria,
      dias_habiles: schedule.length,
      excluir_domingos: input.excluirDomingos,
      excluir_sabados: input.excluirSabados,
      fecha_fin: schedule.at(-1)?.fechaEsperada ?? input.fechaInicio,
      fecha_inicio: input.fechaInicio,
      modelo_interes: input.modeloInteres,
      plazo_dias: input.plazoDias,
      tasa_mensual: input.tasaMensual,
      total_pagar: totals.totalPagar,
    })
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .select("*")
    .single();
  if (updateError) return apiError("INTERNAL_ERROR", updateError.message, 500);

  const { error: saldoError } = await admin.from("prestamo_saldos").upsert({
    capital_original: input.capital,
    organization_id: actor!.organizationId,
    prestamo_id: id,
    saldo_pendiente: totals.totalPagar,
    total_original: totals.totalPagar,
  });
  if (saldoError) return apiError("INTERNAL_ERROR", saldoError.message, 500);

  const { error: deleteScheduleError } = await admin
    .from("cronograma_pagos")
    .delete()
    .eq("prestamo_id", id)
    .eq("organization_id", actor!.organizationId);
  if (deleteScheduleError) return apiError("INTERNAL_ERROR", deleteScheduleError.message, 500);

  const { error: insertScheduleError } = await admin.from("cronograma_pagos").insert(
    schedule.map((cuota) => ({
      cobrador_id: input.cobradorId || null,
      fecha_esperada: cuota.fechaEsperada,
      monto_capital: cuota.montoCapital,
      monto_esperado: cuota.montoEsperado,
      monto_interes: cuota.montoInteres,
      numero_cuota: cuota.numeroCuota,
      organization_id: actor!.organizationId!,
      prestamo_id: id,
      saldo_estimado: cuota.saldoEstimado,
    })),
  );
  if (insertScheduleError) return apiError("INTERNAL_ERROR", insertScheduleError.message, 500);

  await admin.rpc("audit_action", {
    p_accion: "prestamo_editado",
    p_actor_id: actor!.userId,
    p_actor_rol: actor!.role,
    p_entidad: "prestamos",
    p_entidad_id: id,
    p_estado_anterior: existing,
    p_estado_nuevo: updated,
    p_organization_id: actor!.organizationId,
  });

  return apiOk(updated, { cuotas: schedule.length });
}
