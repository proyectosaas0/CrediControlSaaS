import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  const url = new URL(request.url);
  const supabase = await createClient();
  let query = supabase.from("mora_registros").select("*").order("dias_mora", { ascending: false });
  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  const estado = url.searchParams.get("estado");
  if (estado === "activa" || estado === "pagada" || estado === "condonada") query = query.eq("estado", estado);
  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data ?? []);
}
