import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { addSecurityHeaders, getCorsHeaders } from "@/lib/api/security";

const PUBLIC_PREFIXES = ["/login", "/register", "/verify", "/_next", "/favicon.ico", "/api"];

export async function proxy(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || undefined;
    const corsHeaders = getCorsHeaders(origin);
    const response = new NextResponse(null, {
      status: 204,
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const { response, user } = await updateSession(request);

  // Add security headers
  addSecurityHeaders(response);

  // Add CORS headers to all responses
  const origin = request.headers.get("origin") || undefined;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) response.headers.set(key, value);
  });

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));
  const isRoot = path === "/";

  function secureRedirect(destination: URL): NextResponse {
    const r = NextResponse.redirect(destination);
    addSecurityHeaders(r);
    return r;
  }

  if (!user && !isPublic && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return secureRedirect(url);
  }

  if (user) {
    if (path === "/login" || path === "/register" || path === "/verify") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      url.searchParams.delete("redirect");
      return secureRedirect(url);
    }

    if (isRoot) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return secureRedirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
