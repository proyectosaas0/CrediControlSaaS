import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export function apiOk<TData, TMeta extends Record<string, unknown> = Record<string, never>>(
  data: TData,
  meta?: TMeta,
  status = 200,
) {
  return NextResponse.json({ data, meta: meta ?? {} }, { status });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
