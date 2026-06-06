import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const url = new URL(request.url);
  const fecha = url.searchParams.get("fecha") ?? new Date().toISOString().slice(0, 10);
  const cobradorId = actor!.role === "cobrador" ? actor!.userId : url.searchParams.get("cobradorId");

  const supabase = await createClient();
  let query = supabase
    .from("cronograma_pagos")
    .select(
      "id, prestamo_id, organization_id, cobrador_id, fecha_esperada, monto_esperado, monto_pagado, estado, numero_cuota, prestamos!inner(capital, cliente_id, clientes!inner(nombre, telefono, direccion, barrio))"
    )
    .eq("organization_id", actor!.organizationId)
    .eq("fecha_esperada", fecha)
    .order("numero_cuota", { ascending: true });

  if (cobradorId) query = query.eq("cobrador_id", cobradorId);

  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk(data ?? [], { fecha });
}
