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

// Mock data for development/testing without authentication
const MOCK_CLIENTES = [
  { id: "c1", organization_id: "test", nombre: "Cliente 1", cedula: "123", telefono: "555", direccion: "Cra 1", barrio: "Centro", notas: "Test", score_pago: 90, activo: true, created_at: "2024-01-01" },
  { id: "c2", organization_id: "test", nombre: "Cliente 2", cedula: "456", telefono: "555", direccion: "Cra 2", barrio: "Norte", notas: "Test", score_pago: 75, activo: true, created_at: "2024-01-02" },
];

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
  // If not authenticated in development, return mock data
  if (response && process.env.NODE_ENV !== "production") {
    return apiOk(MOCK_CLIENTES);
  }
  if (response) return response;

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
