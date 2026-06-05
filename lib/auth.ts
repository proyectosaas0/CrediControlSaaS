import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "admin" | "cobrador";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function claim<T = string>(user: User | null, key: string): T | null {
  // Los claims viven en el access token; supabase-js los expone en app_metadata
  // tras decodificar, pero la fuente fiable es el JWT. Para server-side leemos
  // del user (app_metadata) que refleja los claims personalizados.
  const value = (user?.app_metadata as Record<string, unknown> | undefined)?.[key];
  return (value ?? null) as T | null;
}

export async function getRole(): Promise<AppRole | null> {
  const user = await getUser();
  return claim<AppRole>(user, "rol");
}

export async function getOrgId(): Promise<string | null> {
  const user = await getUser();
  return claim<string>(user, "organization_id");
}

export async function requireRole(...roles: AppRole[]): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const rol = claim<AppRole>(user, "rol");
  if (!rol || !roles.includes(rol)) throw new Error("Rol no autorizado");
  return user;
}
