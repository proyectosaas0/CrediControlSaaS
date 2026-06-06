import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { response } = await requireApiActor();
  if (response) return response;

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const activo = url.searchParams.get("activo");

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, nombre_completo, telefono, activo, rol")
    .eq("rol", "cobrador");

  if (actor!.organizationId) {
    query = query.eq("organization_id", actor!.organizationId);
  }

  if (activo === "true") query = query.eq("activo", true);
  if (activo === "false") query = query.eq("activo", false);
  if (search) {
    query = query.ilike("nombre_completo", `%${search}%`);
  }

  const { data, error } = await query.order("nombre_completo", { ascending: true });
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk(data ?? []);
}
