import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { addSecurityHeaders, getCorsHeaders } from "@/lib/api/security";

export async function proxy(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || undefined;
    const corsHeaders = getCorsHeaders(origin);
    const response = new NextResponse(null, { status: 204 });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // updateSession handles auth/route decisions and returns the appropriate NextResponse.
  const response = await updateSession(request);

  // Add security headers
  addSecurityHeaders(response);

  // Add CORS headers to all responses
  const origin = request.headers.get("origin") || undefined;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
