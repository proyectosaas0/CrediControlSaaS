import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  const url = new URL(request.url);
  const supabase = await createClient();
  let query = supabase.from("cierres_caja").select("*").eq("organization_id", actor!.organizationId).order("fecha", { ascending: false });
  if (actor!.role === "cobrador") query = query.eq("cobrador_id", actor!.userId);
  const cobradorId = url.searchParams.get("cobradorId");
  if (actor!.role !== "cobrador" && cobradorId) query = query.eq("cobrador_id", cobradorId);
  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data ?? []);
}
