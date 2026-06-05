import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  cronogramaPagoId: z.string().uuid(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  nota: z.string().trim().optional(),
  resultado: z.enum(["pagado", "parcial", "no_encontrado", "promesa_pago", "rechazado"]),
});

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "cobrador", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const supabase = await createClient();
  const { data: cuota, error: cuotaError } = await supabase.from("cronograma_pagos").select("id, organization_id, prestamo_id, cobrador_id, prestamos(cliente_id)").eq("id", parsed.data!.cronogramaPagoId).eq("organization_id", actor!.organizationId).maybeSingle();
  if (cuotaError) return apiError("INTERNAL_ERROR", cuotaError.message, 500);
  if (!cuota) return apiError("NOT_FOUND", "Cuota no encontrada", 404);
  if (actor!.role === "cobrador" && cuota.cobrador_id !== actor!.userId) return apiError("FORBIDDEN", "Cuota no asignada al cobrador", 403);
  const clienteId = Array.isArray(cuota.prestamos) ? cuota.prestamos[0]?.cliente_id : cuota.prestamos?.cliente_id;
  if (!clienteId) return apiError("NOT_FOUND", "Cliente no encontrado", 404);
  const { data, error } = await supabase.from("visitas_cobro").insert({ cliente_id: clienteId, cobrador_id: cuota.cobrador_id ?? actor!.userId, cronograma_pago_id: cuota.id, lat: parsed.data!.lat ?? null, lng: parsed.data!.lng ?? null, nota: parsed.data!.nota ?? null, organization_id: actor!.organizationId, prestamo_id: cuota.prestamo_id, resultado: parsed.data!.resultado }).select("*").single();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data, {}, 201);
}
