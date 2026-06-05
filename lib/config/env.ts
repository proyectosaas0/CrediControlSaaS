import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(
        `Missing or invalid environment variables: ${missing}\n\nSee .env.example for required variables.`
      );
    }
    throw error;
  }
}

// Validate on module load (server-side only)
if (typeof window === "undefined") {
  try {
    validateEnv();
    console.log("✅ Environment variables validated");
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
  }
}
