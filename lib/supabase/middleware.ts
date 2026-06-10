import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateRouteAccess, type RouteRole } from "@/lib/auth/route-guard";
import { isSubscriptionActive } from "@/lib/domain/subscription";
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
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;
  const isAuthenticated = Boolean(claims?.sub);
  const role = ((claims?.rol as RouteRole | undefined) ?? null) as RouteRole;
  const orgId = (claims?.organization_id as string | undefined) ?? null;

  // Subscription status only matters for admin/cobrador on /app routes
  let subscriptionActive = true;
  if (isAuthenticated && role !== "super_admin") {
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("estado_suscripcion, trial_hasta")
        .eq("id", orgId)
        .maybeSingle();
      subscriptionActive = org
        ? isSubscriptionActive({ estado: org.estado_suscripcion, trialHasta: org.trial_hasta })
        : false;
    } else {
      subscriptionActive = false;
    }
  }

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
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
