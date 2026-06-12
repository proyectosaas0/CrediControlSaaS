import { z } from "zod";
import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { parseJson } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin-supabase";

const createAdminSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.email("Ingresa un correo válido"),
  telefono: z.string().trim().optional(),
});

export async function GET() {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, nombre_completo, rol, telefono, activo, ultimo_acceso")
    .eq("organization_id", actor!.organizationId)
    .neq("rol", "super_admin")
    .order("nombre_completo", { ascending: true });

  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  if (!profiles || profiles.length === 0) return apiOk([]);

  // Fetch emails from auth.users via admin client
  const admin = createAdminClient();
  const emailMap: Record<string, string> = {};

  // listUsers paginates up to 1000 — sufficient for any org
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of authData?.users ?? []) {
    emailMap[u.id] = u.email ?? "";
  }

  const usuarios = profiles.map((p) => ({
    id: p.id,
    nombre_completo: p.nombre_completo,
    email: emailMap[p.id] ?? "",
    rol: p.rol,
    telefono: p.telefono,
    activo: p.activo,
    ultimo_acceso: p.ultimo_acceso,
  }));

  return apiOk(usuarios);
}

export async function POST(request: Request) {
  const { actor, response } = await requireApiActor(["admin", "super_admin"]);
  if (response) return response;
  if (!actor!.organizationId) return apiError("FORBIDDEN", "Usuario sin organizacion", 403);

  const parsed = await parseJson(request, createAdminSchema);
  if (parsed.response) return parsed.response;
  const { nombre, email, telefono } = parsed.data!;

  const admin = createAdminClient();

  const { data: userData, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nombre_completo: nombre },
  });
  if (createError) {
    const isDuplicate =
      createError.message.toLowerCase().includes("already registered") ||
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
    telefono: telefono ?? null,
    rol: "admin",
    organization_id: actor!.organizationId,
    activo: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return apiError("INTERNAL_ERROR", profileError.message, 500);
  }

  return apiOk(
    { id: userId, nombre_completo: nombre, email, telefono: telefono ?? null, rol: "admin", activo: true },
    {},
    201,
  );
}
