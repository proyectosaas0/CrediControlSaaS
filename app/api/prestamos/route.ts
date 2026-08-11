import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { paginationParams, parseJson } from "@/lib/api/validation";
import { buildLoanSchedule, calculateLoanTotals } from "@/lib/domain/loans";
import { createAdminClient } from "@/lib/server/admin-supabase";
import { createClient } from "@/lib/supabase/server";

const createPrestamoSchema = z.object({
  capital: z.number().positive(),
  clienteId: z.string().uuid(),
  cobradorId: z.string().uuid().nullable().optional(),
  excluirDomingos: z.boolean().default(false),
  excluirSabados: z.boolean().default(false),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  modeloInteres: z.enum(["cuota_fija", "solo_interes", "sobre_saldo"]),
  plazoDias: z.number().int().positive(),
  tasaMensual: z.number().nonnegative(),
});

const estadoPrestamoSchema = z.enum(["activo", "en_mora", "saldado", "refinanciado", "cancelado"]);

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const { page, pageSize } = paginationParams(url.searchParams);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("prestamos")
    .select(
      "id, organization_id, cliente_id, cobrador_id, estado, capital, cuota_diaria, total_pagar, plazo_dias, modelo_interes, tasa_mensual, fecha_inicio, fecha_fin, created_at, clientes(nombre), prestamo_saldos(*)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);
  const estado = estadoPrestamoSchema.safeParse(url.searchParams.get("estado"));
  if (estado.success) query = query.eq("estado", estado.data);
  const clienteId = url.searchParams.get("cliente_id");
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const cobradorId = url.searchParams.get("cobrador_id");
  if (cobradorId) query = query.eq("cobrador_id", cobradorId);

  const { count, data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  const prestamos = data ?? [];
  const prestamoIds = prestamos.map((p) => p.id);

  const cuotasByPrestamo = new Map<string, { total: number; pagadas: number }>();
  if (prestamoIds.length > 0) {
    const { data: cuotas, error: cuotasError } = await supabase
      .from("cronograma_pagos")
      .select("prestamo_id, estado")
      .in("prestamo_id", prestamoIds)
      .neq("estado", "cancelado");
    if (cuotasError) return apiError("INTERNAL_ERROR", cuotasError.message, 500);

    for (const cuota of cuotas ?? []) {
      const entry = cuotasByPrestamo.get(cuota.prestamo_id) ?? { total: 0, pagadas: 0 };
      entry.total += 1;
      if (cuota.estado === "pagado") entry.pagadas += 1;
      cuotasByPrestamo.set(cuota.prestamo_id, entry);
    }
  }

  const enriched = prestamos.map((p) => {
    const saldoRow = Array.isArray(p.prestamo_saldos)
      ? (p.prestamo_saldos[0] ?? null)
      : (p.prestamo_saldos ?? null);
    const cuotas = cuotasByPrestamo.get(p.id) ?? { total: 0, pagadas: 0 };
    return {
      ...p,
      prestamo_saldos: [
        {
          ...(saldoRow ?? {}),
          prestamo_id: p.id,
          cuotas_pagadas: cuotas.pagadas,
          cuotas_totales: cuotas.total,
          saldo_pendiente: saldoRow?.saldo_pendiente ?? 0,
        },
      ],
    };
  });

  return apiOk(enriched, { count: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, createPrestamoSchema);
  if (parsed.response) return parsed.response;

  const input = parsed.data!;
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

  const admin = createAdminClient();
  const { data: prestamo, error: prestamoError } = await admin
    .from("prestamos")
    .insert({
      capital: input.capital,
      cliente_id: input.clienteId,
      cobrador_id: input.cobradorId ?? null,
      created_by: actor!.userId,
      cuota_diaria: totals.cuotaDiaria,
      dias_habiles: schedule.length,
      excluir_domingos: input.excluirDomingos,
      excluir_sabados: input.excluirSabados,
      fecha_fin: schedule.at(-1)?.fechaEsperada ?? input.fechaInicio,
      fecha_inicio: input.fechaInicio,
      modelo_interes: input.modeloInteres,
      organization_id: actor!.organizationId,
      plazo_dias: input.plazoDias,
      tasa_mensual: input.tasaMensual,
      total_pagar: totals.totalPagar,
    })
    .select("*")
    .single();

  if (prestamoError) return apiError("INTERNAL_ERROR", prestamoError.message, 500);

  const { error: saldoError } = await admin.from("prestamo_saldos").insert({
    capital_original: input.capital,
    organization_id: actor!.organizationId,
    prestamo_id: prestamo.id,
    saldo_pendiente: totals.totalPagar,
    total_original: totals.totalPagar,
  });
  if (saldoError) return apiError("INTERNAL_ERROR", saldoError.message, 500);

  const { error: scheduleError } = await admin.from("cronograma_pagos").insert(
    schedule.map((cuota) => ({
      cobrador_id: input.cobradorId ?? null,
      fecha_esperada: cuota.fechaEsperada,
      monto_capital: cuota.montoCapital,
      monto_esperado: cuota.montoEsperado,
      monto_interes: cuota.montoInteres,
      numero_cuota: cuota.numeroCuota,
      organization_id: actor!.organizationId!,
      prestamo_id: prestamo.id,
      saldo_estimado: cuota.saldoEstimado,
    })),
  );
  if (scheduleError) return apiError("INTERNAL_ERROR", scheduleError.message, 500);

  await admin.rpc("audit_action", {
    p_accion: "prestamo_creado",
    p_actor_id: actor!.userId,
    p_actor_rol: actor!.role,
    p_entidad: "prestamos",
    p_entidad_id: prestamo.id,
    p_estado_nuevo: prestamo,
    p_organization_id: actor!.organizationId,
  });

  return apiOk(prestamo, { cuotas: schedule.length }, 201);
}
