import { NextResponse } from "next/server";
import { getHealth } from "@/lib/monitoring/health";

export async function GET() {
  const health = await getHealth();
  const status = health.status === "healthy" ? 200 : 503;
  return NextResponse.json(health, { status });
}
