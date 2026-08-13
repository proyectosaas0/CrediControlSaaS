import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { buildLoanSchedule, calculateLoanTotals } from "@/lib/domain/loans";
import { createAdminClient } from "@/lib/server/admin-supabase";

const schema = z.object({
  capital: z.number().positive(),
  excluirDomingos: z.boolean().default(false),
  excluirSabados: z.boolean().default(false),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  modeloInteres: z.enum(["cuota_fija", "solo_interes", "sobre_saldo"]),
  plazoDias: z.number().int().positive(),
  tasaMensual: z.number().nonnegative(),
});
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const input = parsed.data!;
  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: previous, error: previousError } = await admin.from("prestamos").select("*").eq("id", id).eq("organization_id", actor!.organizationId).maybeSingle();
  if (previousError) return apiError("INTERNAL_ERROR", previousError.message, 500);
  if (!previous) return apiError("NOT_FOUND", "Prestamo no encontrado", 404);
  const totals = calculateLoanTotals({ capital: input.capital, modelo: input.modeloInteres, plazoDias: input.plazoDias, tasaMensual: input.tasaMensual });
  const schedule = buildLoanSchedule({ capital: input.capital, excluirDomingos: input.excluirDomingos, excluirSabados: input.excluirSabados, fechaInicio: input.fechaInicio, modelo: input.modeloInteres, plazoDias: input.plazoDias, tasaMensual: input.tasaMensual });
  await admin.from("prestamos").update({ estado: "refinanciado" }).eq("id", id);
  const { data: next, error } = await admin.from("prestamos").insert({
    capital: input.capital,
    cliente_id: previous.cliente_id,
    cobrador_id: previous.cobrador_id,
    created_by: actor!.userId,
    cuota_diaria: totals.cuotaDiaria,
    dia_cobro: previous.dia_cobro,
    dias_habiles: schedule.length,
    excluir_domingos: input.excluirDomingos,
    excluir_sabados: input.excluirSabados,
    fecha_fin: schedule.at(-1)?.fechaEsperada ?? input.fechaInicio,
    fecha_inicio: input.fechaInicio,
    modelo_interes: input.modeloInteres,
    organization_id: actor!.organizationId,
    plazo_dias: input.plazoDias,
    prestamo_anterior_id: previous.id,
    tasa_mensual: input.tasaMensual,
    total_pagar: totals.totalPagar,
  }).select("*").single();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  await admin.from("prestamo_saldos").insert({ capital_original: input.capital, organization_id: actor!.organizationId, prestamo_id: next.id, saldo_pendiente: totals.totalPagar, total_original: totals.totalPagar });
  await admin.from("cronograma_pagos").insert(schedule.map((cuota) => ({ cobrador_id: previous.cobrador_id, fecha_esperada: cuota.fechaEsperada, monto_capital: cuota.montoCapital, monto_esperado: cuota.montoEsperado, monto_interes: cuota.montoInteres, numero_cuota: cuota.numeroCuota, organization_id: actor!.organizationId!, prestamo_id: next.id, saldo_estimado: cuota.saldoEstimado })));
  return apiOk(next, {}, 201);
}
