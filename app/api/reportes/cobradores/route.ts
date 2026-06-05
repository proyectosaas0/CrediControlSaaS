import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { groupSum } from "@/lib/domain/reports";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  const url = new URL(request.url);
  const desde = url.searchParams.get("desde") ?? new Date().toISOString().slice(0, 10);
  const hasta = url.searchParams.get("hasta") ?? desde;
  const supabase = await createClient();
  let query = supabase.from("pagos").select("cobrador_id, monto").gte("created_at", `${desde}T00:00:00`).lte("created_at", `${hasta}T23:59:59`);
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(groupSum(data ?? [], "cobrador_id", "monto"), { desde, hasta });
}
