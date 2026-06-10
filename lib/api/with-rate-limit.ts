import { apiError } from "@/lib/api/errors";
import { checkRateLimit, apiRateLimit } from "@/lib/api/rate-limit";
import type { Ratelimit } from "@upstash/ratelimit";

export async function withRateLimit(
  request: Request,
  handler: (request: Request) => Promise<Response>,
  limiter: Ratelimit | null = apiRateLimit,
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const result = await checkRateLimit(ip, limiter);

  if (!result.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Demasiadas solicitudes. Intenta de nuevo más tarde.",
      429,
      { retryAfter: result.resetAfter },
    );
  }

  const response = await handler(request);
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAfter));
  return response;
}
