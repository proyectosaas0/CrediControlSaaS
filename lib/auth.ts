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

// El Custom Access Token Hook inyecta `rol` y `organization_id` como claims de
// PRIMER NIVEL del JWT (no en app_metadata). getClaims() verifica el token y los
// expone; leerlos de user.app_metadata daría null.
async function readClaims(): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims as Record<string, unknown> | undefined) ?? null;
}

export async function getRole(): Promise<AppRole | null> {
  const claims = await readClaims();
  return (claims?.rol as AppRole | undefined) ?? null;
}

export async function getOrgId(): Promise<string | null> {
  const claims = await readClaims();
  return (claims?.organization_id as string | undefined) ?? null;
}

export async function requireRole(...roles: AppRole[]): Promise<User> {
  const user = await getUser();
  if (!user) throw new Error("No autenticado");
  const rol = await getRole();
  if (!rol || !roles.includes(rol)) throw new Error("Rol no autorizado");
  return user;
}
