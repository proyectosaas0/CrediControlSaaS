import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin-supabase";

const createCobradorSchema = z.object({
  nombre: z.string().trim().min(1),
  email: z.email(),
  telefono: z.string().trim().min(7),
});

export async function GET(request: Request) {
  const { actor, response } = await requireApiActor();
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

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, createCobradorSchema);
  if (parsed.response) return parsed.response;
  const { nombre, email, telefono } = parsed.data!;

  const admin = createAdminClient();

  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    // app_created tells handle_new_user to skip org/profile auto-provisioning;
    // this route inserts the profile in the correct org below.
    user_metadata: { nombre_completo: nombre, app_created: true },
  });
  if (createError) {
    const isDuplicate = createError.message.toLowerCase().includes("already registered") ||
      createError.message.toLowerCase().includes("already been registered");
    return apiError(
      isDuplicate ? "CONFLICT" : "INTERNAL_ERROR",
      isDuplicate ? "Ya existe un usuario con ese correo" : createError.message,
      isDuplicate ? 409 : 500,
    );
  }

  const userId = userData.user.id;
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    nombre_completo: nombre,
    telefono,
    rol: "cobrador",
    organization_id: actor!.organizationId,
    activo: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return apiError("INTERNAL_ERROR", profileError.message, 500);
  }

  return apiOk({ id: userId, nombre_completo: nombre, telefono, activo: true, rol: "cobrador" }, {}, 201);
}
