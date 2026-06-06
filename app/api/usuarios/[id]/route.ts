import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin-supabase";

const patchSchema = z.object({
  activo: z.boolean().optional(),
  nombre_completo: z.string().trim().min(1).optional(),
  telefono: z.string().trim().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const { id } = await context.params;
  if (id === actor!.userId) return apiError("FORBIDDEN", "No puedes modificarte a ti mismo", 403);

  const parsed = await parseJson(request, patchSchema);
  if (parsed.response) return parsed.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data!)
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .neq("rol", "super_admin")
    .select("id, nombre_completo, rol, telefono, activo, ultimo_acceso")
    .maybeSingle();

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!data) return apiError("NOT_FOUND", "Usuario no encontrado", 404);

  return apiOk(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const { id } = await context.params;
  if (id === actor!.userId) return apiError("FORBIDDEN", "No puedes eliminarte a ti mismo", 403);

  const supabase = await createClient();

  // Verify belongs to org and is not super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, rol")
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .neq("rol", "super_admin")
    .maybeSingle();

  if (!profile) return apiError("NOT_FOUND", "Usuario no encontrado", 404);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk({ id });
}

export async function POST(request: Request, context: RouteContext) {
  // POST /api/usuarios/[id] → send password reset email
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const { id } = await context.params;

  // Verify belongs to org
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .eq("organization_id", actor!.organizationId)
    .maybeSingle();

  if (!profile) return apiError("NOT_FOUND", "Usuario no encontrado", 404);

  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(id);
  if (!userData.user?.email) return apiError("NOT_FOUND", "Email del usuario no encontrado", 404);

  const { error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: userData.user.email,
  });

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);

  return apiOk({ message: "Correo de recuperacion enviado" });
}
