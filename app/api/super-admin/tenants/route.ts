import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createAdminClient } from "@/lib/server/admin-supabase";

const schema = z.object({ ciudad: z.string().optional(), nombreNegocio: z.string().trim().min(1), telefono: z.string().optional() });

export async function GET() {
  const { response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").select("*").order("created_at", { ascending: false });
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data ?? []);
}

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["super_admin"]);
  if (response) return response;
  const parsed = await parseJson(request, schema);
  if (parsed.response) return parsed.response;
  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").insert({ ciudad: parsed.data!.ciudad ?? null, nombre_negocio: parsed.data!.nombreNegocio, telefono: parsed.data!.telefono ?? null }).select("*").single();
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  await admin.rpc("audit_action", { p_accion: "tenant_creado", p_actor_id: actor!.userId, p_actor_rol: actor!.role, p_entidad: "organizations", p_entidad_id: data.id, p_estado_nuevo: data, p_organization_id: data.id });
  return apiOk(data, {}, 201);
}
