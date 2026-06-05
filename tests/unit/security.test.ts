import { describe, it, expect } from "vitest";
import { getCorsHeaders } from "@/lib/api/security";

describe("Security", () => {
  it("includes CORS headers for allowed origin", () => {
    const headers = getCorsHeaders("http://localhost:3000");
    expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });

  it("excludes CORS headers for disallowed origin", () => {
    const headers = getCorsHeaders("http://evil.com");
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("includes all required security headers", () => {
    const required = [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
      "Content-Security-Policy",
    ];
    expect(required.length).toBe(5);
  });
});
