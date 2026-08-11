import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

type RealCookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieStore = {
  getAll: RealCookieStore["getAll"];
  set: (...args: Parameters<RealCookieStore["set"]>) => void;
};

const noopCookieStore: CookieStore = {
  getAll: () => [],
  set: () => undefined,
};

export async function createClient() {
  let cookieStore: CookieStore;
  try {
    // En entorno de request esto funciona; en tests/otros contextos puede lanzar.
    cookieStore = await cookies();
  } catch {
    // Fallback: dummy cookie store para entornos sin request (tests, scripts)
    cookieStore = noopCookieStore;
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignorar en entornos sin capacidad de set de cookies.
          }
        },
      },
    },
  );
}
