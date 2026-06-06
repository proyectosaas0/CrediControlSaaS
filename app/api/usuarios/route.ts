import { requireApiActor } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/server/admin-supabase";

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
