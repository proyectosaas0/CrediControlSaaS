import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

function createLimiter(limiter: Ratelimit["limiter"]): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter, analytics: true });
}

export const globalRateLimit = createLimiter(Ratelimit.slidingWindow(1000, "1 h"));
export const authRateLimit = createLimiter(Ratelimit.slidingWindow(5, "15 m"));
export const apiRateLimit = createLimiter(Ratelimit.slidingWindow(100, "1 m"));

export async function checkRateLimit(
  key: string,
  limiter: Ratelimit | null,
): Promise<{ allowed: boolean; remaining: number; resetAfter: number }> {
  if (!limiter) return { allowed: true, remaining: -1, resetAfter: -1 };
  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAfter: result.reset,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: true, remaining: -1, resetAfter: -1 };
  }
}
