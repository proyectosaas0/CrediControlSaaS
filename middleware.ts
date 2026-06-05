import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = ["/login", "/register", "/verify", "/_next", "/favicon.ico", "/api"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));
  const isRoot = path === "/";

  if (!user && !isPublic && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user) {
    if (path === "/login" || path === "/register" || path === "/verify") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      url.searchParams.delete("redirect");
      return NextResponse.redirect(url);
    }

    if (isRoot) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
