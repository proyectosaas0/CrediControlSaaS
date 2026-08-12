export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type PaginationMeta = { count: number; page: number; pageSize: number };

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url;
}

export async function fetchApi<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const res = await fetch(buildUrl(path, params).toString());
  return parseApiResponse<T>(res);
}

export async function fetchApiPaginated<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<{ data: T; meta: PaginationMeta }> {
  const res = await fetch(buildUrl(path, params).toString());
  return parseApiResponseWithMeta<T>(res);
}

export async function postApi<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseApiResponse<T>(res);
}

async function readJson<T>(res: Response): Promise<{ data?: T; meta?: PaginationMeta; error?: { code?: string; message?: string } }> {
  try {
    return await res.json();
  } catch {
    throw new ApiError("PARSE_ERROR", `Error ${res.status}: respuesta inválida`, res.status);
  }
}

function assertOk(res: Response, json: { error?: { code?: string; message?: string } }) {
  if (!res.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN",
      json.error?.message ?? `Error ${res.status}`,
      res.status,
    );
  }
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = await readJson<T>(res);
  assertOk(res, json);
  return json.data as T;
}

async function parseApiResponseWithMeta<T>(res: Response): Promise<{ data: T; meta: PaginationMeta }> {
  const json = await readJson<T>(res);
  assertOk(res, json);
  return { data: json.data as T, meta: json.meta ?? { count: 0, page: 1, pageSize: 0 } };
}
