import { NextResponse, type NextRequest } from "next/server";

export function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(self), camera=(), microphone=()"
  );
  // CSP for Next.js: Allow inline scripts/styles for Turbopack HMR in dev
  // In production, consider using nonces for stricter security
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  return response;
}

function isValidOrigin(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    // Production must use https
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      console.warn(`[CORS] Invalid NEXT_PUBLIC_APP_URL: must use https in production`);
      return false;
    }
    return true;
  } catch {
    console.warn(`[CORS] Invalid NEXT_PUBLIC_APP_URL format: ${url}`);
    return false;
  }
}

export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(isValidOrigin(process.env.NEXT_PUBLIC_APP_URL)
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : []),
  ];

  const isAllowed = allowedOrigins.includes(origin || "");

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "3600",
  };

  if (isAllowed && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
