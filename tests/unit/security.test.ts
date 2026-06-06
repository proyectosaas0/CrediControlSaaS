import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { addSecurityHeaders, getCorsHeaders } from "@/lib/api/security";

describe("Security Headers", () => {
  it("adds all required security headers to response", () => {
    const response = new NextResponse();
    addSecurityHeaders(response);

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'"
    );
    expect(response.headers.get("Permissions-Policy")).toContain(
      "geolocation=(self)"
    );
  });

  it("CSP contains required directives", () => {
    const response = new NextResponse();
    addSecurityHeaders(response);

    const csp = response.headers.get("Content-Security-Policy") || "";
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
    expect(csp).toContain("style-src");
    expect(csp).toContain("connect-src");
    expect(csp).toContain("supabase.co");
  });
});

describe("CORS Headers", () => {
  it("includes CORS headers for allowed origin", () => {
    const headers = getCorsHeaders("http://localhost:3000");
    expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("excludes CORS headers for disallowed origin", () => {
    const headers = getCorsHeaders("http://evil.com");
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("excludes CORS headers for null origin", () => {
    const headers = getCorsHeaders(undefined);
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("includes all required CORS methods and headers", () => {
    const headers = getCorsHeaders("http://localhost:3000");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(headers["Access-Control-Allow-Methods"]).toContain("DELETE");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
  });
});
