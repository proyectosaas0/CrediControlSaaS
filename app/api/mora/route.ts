import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const estado = url.searchParams.get("estado");

  const supabase = await createClient();
  let query = supabase
    .from("mora_registros")
    .select(
      "id, organization_id, prestamo_id, dias_mora, estado, fecha_inicio_mora, monto_mora, monto_pagado_mora, prestamos!inner(capital, cuota_diaria, cliente_id, cobrador_id, clientes!inner(nombre, telefono))"
    )
    .order("dias_mora", { ascending: false });

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (estado === "activa" || estado === "pagada" || estado === "condonada") {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data ?? []);
}
