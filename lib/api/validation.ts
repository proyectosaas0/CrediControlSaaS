import { type ZodSchema } from "zod";
import { apiError } from "@/lib/api/errors";

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      data: null,
      response: apiError("VALIDATION_ERROR", "Entrada invalida", 422, parsed.error.flatten()),
    };
  }

  return { data: parsed.data, response: null };
}

export function paginationParams(searchParams: URLSearchParams, defaultPageSize = 20) {
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? String(defaultPageSize));

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : defaultPageSize,
  };
}
