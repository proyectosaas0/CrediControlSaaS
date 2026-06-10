import { describe, it, expect, vi } from "vitest";
import { withRateLimit } from "@/lib/api/with-rate-limit";
import type { Ratelimit } from "@upstash/ratelimit";

function fakeLimiter(allowed: boolean): Ratelimit {
  return {
    limit: vi.fn().mockResolvedValue({
      success: allowed,
      remaining: allowed ? 99 : 0,
      reset: 1234,
      limit: 100,
      pending: Promise.resolve(),
    }),
  } as unknown as Ratelimit;
}

const req = new Request("http://localhost/api/prestamos", {
  headers: { "x-forwarded-for": "1.2.3.4" },
});

describe("withRateLimit", () => {
  it("executes handler and adds rate-limit headers when allowed", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await withRateLimit(req, handler, fakeLimiter(true));
    expect(handler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("returns 429 without calling handler when limit exceeded", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await withRateLimit(req, handler, fakeLimiter(false));
    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(429);
  });
});
