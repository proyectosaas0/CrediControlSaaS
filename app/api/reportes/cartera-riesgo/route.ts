import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const supabase = await createClient();
  let query = supabase.from("mora_registros").select("dias_mora, monto_mora").eq("estado", "activa");
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  const rows = data ?? [];
  return apiOk({
    mayorA15: rows.filter((r) => (r.dias_mora ?? 0) > 15).length,
    mayorA3: rows.filter((r) => (r.dias_mora ?? 0) > 3).length,
    mayorA7: rows.filter((r) => (r.dias_mora ?? 0) > 7).length,
    montoTotal: rows.reduce((sum, row) => sum + (row.monto_mora ?? 0), 0),
  });
}
