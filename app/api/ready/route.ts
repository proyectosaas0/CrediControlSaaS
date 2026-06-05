import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/monitoring/health";

export async function GET() {
  const readiness = await getReadiness();
  const status = readiness.ready ? 200 : 503;
  return NextResponse.json(readiness, { status });
}
