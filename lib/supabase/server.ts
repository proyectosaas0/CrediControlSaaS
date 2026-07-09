import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  let cookieStore: ReturnType<typeof cookies> | null = null;
  try {
    // En entorno de request esto funciona; en tests/otros contextos puede lanzar.
    cookieStore = await cookies();
  } catch {
    // Fallback: dummy cookie store para entornos sin request (tests, scripts)
    cookieStore = {
      getAll: () => [],
      get: () => undefined,
      set: () => undefined,
      delete: () => undefined,
    } as any;
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return (cookieStore as any).getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              (cookieStore as any).set?.(name, value, options),
            );
          } catch {
            // Ignorar en entornos sin capacidad de set de cookies.
          }
        },
      },
    },
  );
}
