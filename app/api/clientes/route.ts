import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { paginationParams, parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";

const createClienteSchema = z.object({
  barrio: z.string().trim().optional(),
  cedula: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  nombre: z.string().trim().min(1),
  notas: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
});

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  if (!actor!.organizationId && actor!.role !== "super_admin") {
    return apiError("FORBIDDEN", "Usuario sin organizacion", 403);
  }

  const url = new URL(request.url);
  const { page, pageSize } = paginationParams(url.searchParams);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = url.searchParams.get("search")?.trim();
  const activo = url.searchParams.get("activo");

  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("id, organization_id, nombre, cedula, telefono, direccion, barrio, notas, score_pago, activo, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actor!.organizationId) query = query.eq("organization_id", actor!.organizationId);
  if (activo === "true") query = query.eq("activo", true);
  if (activo === "false") query = query.eq("activo", false);
  if (search) query = query.or(`nombre.ilike.%${search}%,cedula.ilike.%${search}%`);

  const { count, data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk(data ?? [], { count: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, createClienteSchema);
  if (parsed.response) return parsed.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...parsed.data!, organization_id: actor!.organizationId })
    .select("id, organization_id, nombre, cedula, telefono, direccion, barrio, notas, score_pago, activo, created_at")
    .single();

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data, {}, 201);
}
