import { describe, it, expect, vi } from "vitest";
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

  it("CSP production: tiene unsafe-inline (Next.js lo requiere) pero no unsafe-eval", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = new NextResponse();
    addSecurityHeaders(response);

    vi.unstubAllEnvs();

    const csp = response.headers.get("Content-Security-Policy") || "";
    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(csp).toContain("supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
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
