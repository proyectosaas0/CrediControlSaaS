import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateRouteAccess, type RouteRole } from "@/lib/auth/route-guard";
import type { Database } from "@/lib/database.types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT (Supabase SSR pattern): do NOT run code between createServerClient
  // and getClaims. getClaims() verifies/refreshes the token.
  const claimsResult = await supabase.auth.getClaims().catch(() => ({ data: null, error: null }));
  const claims = claimsResult.data?.claims ?? null;
  const isAuthenticated = Boolean(claims?.sub);
  const role = ((claims?.rol as RouteRole | undefined) ?? null) as RouteRole;

  // Nota: la lógica de bloqueo por estado de suscripción se ha eliminado.
  // Para preservar la firma de evaluateRouteAccess mantenemos el flag en true.
  const subscriptionActive = true;

  const decision = evaluateRouteAccess({
    pathname: request.nextUrl.pathname,
    isAuthenticated,
    role,
    subscriptionActive,
  });

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    const [path, query = ""] = decision.to.split("?");
    url.pathname = path;
    url.search = query ? `?${query}` : "";
    const redirectResponse = NextResponse.redirect(url);
    // Carry over any refreshed session cookies from supabaseResponse
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirectResponse.cookies.set(c.name, c.value, c),
    );
    return redirectResponse;
  }

  return supabaseResponse;
}
