import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import type { AppRole } from "@/lib/auth";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresca la sesión (no quitar).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lee el rol del JWT (sin llamada extra a la BD).
  let role: AppRole | null = null;
  if (user) {
    const { data: claimsData } = await supabase.auth.getClaims();
    role = (claimsData?.claims?.rol as AppRole | undefined) ?? null;
  }

  return { response, user, role };
}
