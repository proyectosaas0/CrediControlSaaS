import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    latency: number;
  };
};

export type ReadinessStatus = {
  ready: boolean;
  database: boolean;
  services: {
    supabase: boolean;
  };
};

const startTime = Date.now();

export async function getHealth(): Promise<HealthStatus> {
  const dbStart = Date.now();
  let dbConnected = false;
  let dbLatency = 0;

  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
    const { data } = await supabase.from("profiles").select("id").limit(1);
    dbConnected = !!data;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbLatency = Date.now() - dbStart;
  }

  return {
    status: dbConnected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    database: {
      connected: dbConnected,
      latency: dbLatency,
    },
  };
}

export async function getReadiness(): Promise<ReadinessStatus> {
  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
    const { data } = await supabase.from("profiles").select("id").limit(1);
    return {
      ready: !!data,
      database: !!data,
      services: { supabase: !!data },
    };
  } catch {
    return {
      ready: false,
      database: false,
      services: { supabase: false },
    };
  }
}
