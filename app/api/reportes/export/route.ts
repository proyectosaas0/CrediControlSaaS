import { requireApiActor } from "@/lib/api/auth";
import { apiError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const supabase = await createClient();
  let query = supabase.from("pagos").select("created_at, monto, medio_pago, tipo").order("created_at", { ascending: false }).limit(1000);
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  const header = "created_at,monto,medio_pago,tipo";
  const rows = (data ?? []).map((row) => `${row.created_at},${row.monto},${row.medio_pago},${row.tipo}`);
  return new Response([header, ...rows].join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}
